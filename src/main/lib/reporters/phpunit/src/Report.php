<?php

namespace LodeApp\PHPUnit;

use PHPUnit\Framework\Test;
use PHPUnit\Framework\Warning;
use PHPUnit\Framework\WarningTestCase;
use PHPUnit\Runner\Version;
use PHPUnit\Util\TestDox\NamePrettifier;
use ReflectionClass;
use Throwable;

class Report
{
    /**
     * A map of PHPUnit vs. Lode string statuses
     *
     * @var array
     */
    protected $statuses = [
        0 => 'passed', // PASSED
        1 => 'skipped', // SKIPPED
        2 => 'incomplete', // INCOMPLETE
        3 => 'failed', // FAILURE
        4 => 'failed', // ERROR
        5 => 'empty', // RISKY
        6 => 'warning', // WARNING
    ];

    /**
     * Name prettifier, for consistent transformations.
     *
     * @var \PHPUnit\Util\TestDox\NamePrettifier
     */
    protected $prettifier;

    /**
     * The test's reflection class.
     *
     * @var ReflectionClass
     */
    protected $reflection;

    /**
     * The test originating object. Not necessarily corresponds
     * to the test itself (i.e. could be a warning).
     *
     * @var PHPUnit\Framework\Test
     */
    protected $test;

    /**
     * The exception triggered by the test, if any.
     *
     * @var \Throwable
     */
    protected $exception;

    /**
     * The total duration of this report.
     *
     * @var float
     */
    protected $time;

    /**
     * Whether this report is the last of a given suite.
     *
     * @var bool
     */
    protected $isLast = false;

    /**
     * The test's class name.
     *
     * @var ReflectionClass
     */
    protected $class;

    /**
     * Create a new Lode report class.
     *
     * @param \PHPUnit\Framework\Test $test
     */
    public function __construct(Test $test)
    {
        $this->test = $test;
        $this->class = get_class($this->test);
        if ($this->isWarning()) {
            $original = $this->getWarningClass();
            if ($original) {
                $this->class = $original;
            }
        }
        $this->reflection = new ReflectionClass($this->class);

        $this->prettifier = new NamePrettifier;
        $this->console = Lode::make(Console::class);
    }

    /**
     * Inject an exception into this report.
     *
     * @param \Throwable|null $t
     * @return this
     */
    public function withException(Throwable $t = null)
    {
        $this->exception = $t;
        return $this;
    }

    /**
     * Set the total duration of this report.
     *
     * @param float $time
     * @return this
     */
    public function setTime(float $time)
    {
        $this->time = round($time * 1000); // In milliseconds
        return $this;
    }

    /**
     * Set the `isLast` property of this report
     *
     * @param bool $isLast
     * @return this
     */
    public function setIsLast($isLast)
    {
        $this->isLast = $isLast;
        return $this;
    }

    /**
     * Get this report's filename
     *
     * @return string
     */
    public function getFileName()
    {
        return $this->reflection->getFileName();
    }

    /**
     * Get this report's class name
     *
     * @return string
     */
    public function getClass()
    {
        return $this->class;
    }

    /**
     * Return default attributes from the report's test.
     *
     * @return array
     */
    public function hydrateTest()
    {
        $name = $this->test->getName();
        if ($this->isWarning()) {
            $original = $this->getWarningName();
            if ($original) {
                $name = $original;
            }
        }

        return $this->transformContainer([
            'identifier' => $name,
            'name' => $name,
            'displayName' => $this->transformName($name),
            'status' => 'idle',
            'feedback' => [],
            'stats' => [],
            'console' => [],
        ]);
    }

    /**
     * Get a standardise Lode app suite with given children.
     *
     * @param array $children
     * @return array
     */
    public function hydrateSuite($children)
    {
        return $this->transformContainer([
            'file' => $this->getFileName(),
            'tests' => $children,
            'testsLoaded' => true,
            // Since we can't really know when a suite and not a test has logged an entry
            // we'll just pull the remainder of the console if this is the suite's last entry.
            'console' => $this->isLast ? $this->console->pullSuiteLogs($this->getFileName()) : [],
            'meta' => [
                'class' => $this->getClass(),
                'groups' => $this->test->getGroups(),
            ],
        ]);
    }

    /**
     * Whether this report is a warning.
     *
     * @return bool
     */
    public function isWarning()
    {
        return $this->test instanceof WarningTestCase;
    }

    /**
     * Whether this is an empty suite report.
     *
     * @return bool
     */
    public function isEmpty()
    {
        return $this->getWarningType() === 'empty';
    }

    /**
     * Render standardise test results for Lode app consumption.
     *
     * @return array
     */
    public function render()
    {
        $current = array_merge($this->hydrateTest(), [
            'status' => $this->status(),
            'feedback' => $this->exception ? (new Feedback($this->exception))->render() : null,
            'console' => $this->console->pullTestLogs($this->getFileName(), $this->test->getName()),
            'stats' => [
                'duration' => $this->time,
                'assertions' => $this->getNumAssertions(),
            ],
            'isLast' => $this->isLast,
        ]);

        return $this->hydrateSuite(
            $this->isWarning() && $this->isEmpty()
            ? []
            : [$current]
        );
    }

    /**
     * Standardise attributes into a Lode app container (i.e. suite or test).
     *
     * @param array $attributes
     * @return array
     */
    protected function transformContainer(array $attributes)
    {
        // Attach common attributes, if any
        return $attributes;
    }

    /**
     * Make a test's name more human-readable.
     *
     * @param string $name
     * @return string
     */
    protected function transformName(string $name)
    {
        return preg_replace('/^it\s/', '', $this->prettifier->prettifyTestMethod($name));
    }

    /**
     * Map a PHPUnit status string into a standardized
     * Lode status string.
     *
     * @return string
     */
    protected function status()
    {
        return Util::get($this->statuses, $this->test->getStatus(), 'warning');
    }

    /**
     * Get the test method name from a Warning exception's message.
     *
     * @return string
     */
    protected function getWarningName()
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
     *
     * @return string
     */
    protected function getWarningClass()
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
     *
     * @return string
     */
    protected function getWarningType()
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
