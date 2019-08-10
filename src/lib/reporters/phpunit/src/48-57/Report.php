<?php

namespace LodeApp\PHPUnit;

use PHPUnit_Framework_Test;
use PHPUnit_Framework_WarningTestCase;
use PHPUnit_Util_TestDox_NamePrettifier;
use ReflectionClass;
use Throwable;

class Report
{
    /**
     * Name prettifier, for consistent transformations.
     *
     * @var \PHPUnit_Util_TestDox_NamePrettifier
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
     * @var PHPUnit_Framework_Test
     */
    protected $test;

    /**
     * The outcome of the test run, standardised
     * for display inside of Lode.
     *
     * @var string
     */
    protected $status;

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
     * The test's running order.
     *
     * @var int
     */
    protected $order;

    /**
     * Create a new Lode report class.
     *
     * @param \PHPUnit_Framework_Test $test
     * @param string $status
     */
    public function __construct(PHPUnit_Framework_Test $test, $status = 'idle')
    {
        $this->test = $test;
        $this->status = $status;
        $this->class = get_class($this->test);
        if ($this->isWarning()) {
            $original = $this->getWarningClass();
            if ($original) {
                $this->class = $original;
            }
        }
        $this->reflection = new ReflectionClass($this->class);

        $this->prettifier = new PHPUnit_Util_TestDox_NamePrettifier;
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
     * Set the `order` property of this report.
     *
     * @param int $order
     * @return this
     */
    public function setOrder($order)
    {
        $this->order = $order;
        return $this;
    }

    /**
     * Set the `isLast` property of this report.
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
     * Get this report's class name
     *
     * @return string
     */
    public function getName()
    {
        $name = $this->test->getName();
        if ($this->isWarning()) {
            $original = $this->getWarningName();
            if ($original) {
                $name = $original;
            }
        }

        return $name;
    }

    /**
     * Return default attributes from the report's test.
     *
     * @return array
     */
    public function hydrateTest()
    {
        $name = $this->getName();

        return $this->transformContainer([
            'id' => sha1($this->getFileName().$name),
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
            'meta' => Util::compact([
                'n' => $this->order,
                'class' => $this->getClass(),
                'groups' => method_exists($this->test, 'getGroups') ? $this->test->getGroups() : [],
            ]),
        ]);
    }

    /**
     * Whether this report is a warning.
     *
     * @return bool
     */
    public function isWarning()
    {
        return $this->test instanceof PHPUnit_Framework_WarningTestCase;
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
            'status' => $this->status,
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
