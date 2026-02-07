<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit;

use PHPUnit\Event\Code\ComparisonFailure;
use PHPUnit\Event\Code\Test;
use PHPUnit\Event\Code\Throwable;
use PHPUnit\Event\Telemetry\Duration;
use ReflectionClass;

class Report
{
    /**
     * The test's class name.
     */
    private string $class;

    /**
     * The test's reflection class.
     */
    private ReflectionClass $reflection;

    /**
     * The exception triggered by the test, if any.
     */
    private ?Throwable $throwable = null;

    /**
     * The comparison object, if any.
     */
    private ?ComparisonFailure $comparison = null;

    /**
     * The total duration of this report.
     */
    private float $duration = 0;

    /**
     * The number of assertions of this report.
     */
    private int $assertions = 0;

    /**
     * Whether this report is the last of a given suite.
     */
    private bool $isLast = false;

    /**
     * The test's running order.
     */
    private ?int $order = null;

    /**
     * The reporter's console helper.
     */
    private Console $console;

    /**
     * Create a new Lode report class.
     */
    public function __construct(private Test $test, private Status $status = Status::IDLE)
    {
        $this->class = $test->className();

        $this->reflection = new ReflectionClass($this->class);

        $this->console = Lode::make(Console::class);
    }

    /**
     * Inject an exception into this report.
     */
    public function withException(?Throwable $throwable = null): self
    {
        $this->throwable = $throwable;

        return $this;
    }

    /**
     * Inject a comparison into this report.
     */
    public function withComparison(?ComparisonFailure $comparison = null): self
    {
        $this->comparison = $comparison;

        return $this;
    }

    public function setStatus(Status $status): self
    {
        $this->status = $status;

        return $this;
    }

    /**
     * Set the total duration of this report
     */
    public function setDuration(Duration $duration): self
    {
        $this->duration = round(($duration->nanoseconds() ?: 1) / 1000); // In milliseconds

        return $this;
    }

    /**
     * Set the number of assertions for this report.
     */
    public function setAssertions(int $assertions): self
    {
        $this->assertions = $assertions;

        return $this;
    }

    /**
     * Set the `order` property of this report.
     */
    public function setOrder(int $order): self
    {
        $this->order = $order;

        return $this;
    }

    /**
     * Set the `isLast` property of this report.
     */
    public function setIsLast(bool $isLast): self
    {
        $this->isLast = $isLast;

        return $this;
    }

    /**
     * Get this report's filename
     */
    public function getFileName(): string
    {
        return $this->reflection->getFileName();
    }

    /**
     * Get this report's class name
     */
    public function getClass(): string
    {
        return $this->class;
    }

    /**
     * Get this report's class name
     */
    public function getName(): string
    {
        return $this->test->name();
    }

    /**
     * Get this report's identifier.
     */
    public function getId(): string
    {
        return sha1($this->getFileName().$this->getName());
    }

    /**
     * Return default attributes from the report's test.
     */
    public function hydrateTest(): array
    {
        return $this->transformContainer([
            'id' => $this->getId(),
            'name' => $this->getName(),
            'displayName' => $this->transformName($this->getName()),
            'status' => $this->status->value,
            'feedback' => [],
            'console' => [],
            'params' => '',
            'stats' => [],
        ]);
    }

    /**
     * Get a standardise Lode app suite with given children.
     */
    public function hydrateSuite(array $children): array
    {
        return $this->transformContainer([
            'file' => $this->getFileName(),
            'tests' => $children,
            // Since we can't really know when a suite and not a test has logged an entry
            // we'll just pull the remainder of the console if this is the suite's last entry.
            'console' => $this->isLast ? $this->console->pullSuiteLogs($this->getFileName()) : [],
            'meta' => Util::compact([
                'n' => $this->order,
                'class' => $this->getClass(),
                'groups' => [],
            ]),
        ]);
    }

    /**
     * Whether this report is a warning.
     */
    public function isWarning(): bool
    {
        return $this->status === Status::WARNING;
    }

    /**
     * Whether this is an empty suite report.
     */
    public function isEmpty(): bool
    {
        return $this->status === Status::EMPTY;
    }

    /**
     * Render standardise test results for Lode app consumption.
     */
    public function render(): array
    {
        $current = array_merge($this->hydrateTest(), [
            'status' => $this->status->value,
            'feedback' => $this->throwable
                ? (new Feedback($this->throwable, $this->comparison))->render()
                : null,
            'console' => $this->console->pullTestLogs($this->getFileName(), $this->test->name()),
            'params' => $this->test->testData()?->hasDataFromDataProvider()
                ? implode(', ', array_map(
                    fn ($data) => $this->transformParameters($data->dataAsStringForResultOutput()),
                    $this->test->testData()->asArray()
                ))
                : '',
            'stats' => [
                'duration' => $this->duration,
                'assertions' => $this->assertions,
            ],
            'isLast' => $this->isLast,
        ]);

        return $this->hydrateSuite([$current]);
    }

    /**
     * Standardise attributes into a Lode app container (i.e. suite or test).
     */
    private function transformContainer(array $attributes): array
    {
        // Attach common attributes, if any
        return $attributes;
    }

    /**
     * Make a test's name more human-readable.
     */
    private function transformName(string $name): string
    {
        return preg_replace('/^it\s/', '', $this->test->testDox()->prettifiedMethodName());
    }

    /**
     * Clean-up the data-as-string provided by PHPUnit.
     */
    private function transformParameters(string $data): string
    {
        return preg_replace('/^ with data set (#\d*|".*") \((.*)\)/', '$2', $data);
    }

    /**
     * Get the test method name from a Warning exception's message.
     */
    private function getWarningName(): string
    {
        $warnings = [
            '/The data provider specified for .+::(.+) is invalid\./',
            '/Test method "(.+)" in test class ".+" is not public\./',
        ];

        foreach ($warnings as $warning) {
            $name = preg_replace($warning, '$1', $this->test->getMessage());
            if ($name !== $this->test->getMessage()) {
                return $name;
            }
        }

        return '';
    }

    /**
     * Get the test class name from a Warning exception's message.
     */
    private function getWarningClass(): string
    {
        $warnings = [
            '/The data provider specified for (.+)::.+ is invalid\./',
            '/No tests found in class "(.+)"\./',
            '/Class "(.+)" has no public constructor\./',
            '/Test method ".+" in test class "(.+)" is not public\./',
            '/Cannot instantiate class "(.+)"\./',
        ];

        foreach ($warnings as $warning) {
            $class = preg_replace($warning, '$1', $this->test->getMessage());
            if ($class !== $this->test->getMessage()) {
                return $class;
            }
        }

        return '';
    }

    /**
     * Get the type of warning from a Warning exception's message.
     */
    private function getWarningType(): string
    {
        $warnings = [
            'empty' => '/No tests found in class ".+"\./',
        ];

        foreach ($warnings as $type => $warning) {
            if (preg_match($warning, $this->test->getMessage())) {
                return $type;
            }
        }

        return '';
    }

    /**
     * Catch all method calls
     *
     * @param string $method
     * @param mixed $parameters
     * @return mixed
     */
    public function __call($method, $parameters)
    {
        return call_user_func_array([$this->test, $method], $parameters);
    }

    /**
     * Catch all get calls
     *
     * @param  string  $key
     * @return mixed
     */
    public function __get($key)
    {
        return $this->test->$key;
    }
}
