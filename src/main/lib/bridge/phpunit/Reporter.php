<?php

namespace LodeApp\PHPUnit;

use PHPUnit\Framework\AssertionFailedError;
use PHPUnit\Framework\Test;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\TestResult;
use PHPUnit\Framework\TestSuite;
use PHPUnit\Framework\TestSuiteIterator;
use PHPUnit\Framework\Warning;
use PHPUnit\Runner\PhptTestCase;
use PHPUnit\Runner\Filter\NameFilterIterator;
use PHPUnit\Runner\Filter\Factory;
use PHPUnit\TextUI\Command;
use PHPUnit\TextUI\ResultPrinter;
use PHPUnit\Util\TestDox\NamePrettifier;
use RecursiveIteratorIterator;
use ReflectionClass;
use ReflectionMethod;
use Throwable;

class Reporter extends ResultPrinter
{
    /**
     * A map of PHPUnit vs. Lode string statuses
     *
     * @var array
     */
    protected $statuses = [
        0 => 'passed',     // PASSED
        1 => 'skipped',    // SKIPPED
        2 => 'incomplete', // INCOMPLETE
        3 => 'failed',     // FAILURE
        4 => 'failed',     // ERROR
        5 => 'empty',      // RISKY
        6 => 'warning',    // WARNING
    ];

    /**
     * Whether the reporter has printed any output
     *
     * @var bool
     */
    protected $pristine = true;

    /**
     * Whether to list all tests or report them.
     *
     * @var bool
     */
    protected $listTests = false;

    /**
     * The complete test list array
     *
     * @var array
     */
    protected $all = [];

    /**
     * Name prettifier, for consistent transformations.
     *
     * @var \PHPUnit\Util\TestDox\NamePrettifier
     */
    protected $prettifier;

    /**
     * Create a new Lode reporter instance.
     *
     * @param mixed      $out
     * @param bool       $verbose
     * @param string     $colors
     * @param bool       $debug
     * @param int|string $numberOfColumns
     * @param bool       $reverse
     *
     * @throws Exception
     */
    public function __construct(
        $out = null,
        bool $verbose = false,
        $colors = self::COLOR_DEFAULT,
        bool $debug = false,
        $numberOfColumns = 80,
        bool $reverse = false
    ) {
        parent::__construct($out, $verbose, $colors, $debug, $numberOfColumns, $reverse);

        $this->prettifier = new NamePrettifier();

        // Since we have no way of natively listing all tests and
        // columns setting is of no use, define an arbitrary
        // number which will signify our custom command.
        if ($numberOfColumns === 42) {
            $this->listTests = true;
        }
    }

    /**
     * A test suite has started.
     *
     * If we're listing tests, not running them, we'll
     * hijack this function to print them immediately,
     * then abort execution.
     *
     * @param \PHPUnit\Framework\TestSuite $suite
     * @return void
     */
    public function startTestSuite(TestSuite $suite): void
    {
        // Before starting, compile a detailed list of all the tests we'll run.
        // This helps us output pointers regarding the progress of each test group.
        foreach (new RecursiveIteratorIterator(new TestSuiteIterator($suite)) as $test) {
            $reflector = new ReflectionClass(get_class($test));
            $filename = $reflector->getFileName();

            if (!isset($this->all[$filename])) {
                $this->all[$filename] = [
                    'file' => $reflector->getFileName(),
                    'tests' => [],
                    'meta' => [
                        'class' => get_class($test),
                        'groups' => $test->getGroups(),
                    ],
                ];
            }

            // Only add if it test doesn't already exist.
            if (array_search($test->getName(), array_column($this->all[$filename]['tests'], 'name')) === false) {
                $this->all[$filename]['tests'][] = [
                    'name' => $test->getName(),
                    'displayName' => $this->transformName($test->getName()),
                    'status' => 'idle',
                    'feedback' => [],
                    'assertions' => 0,
                    'console' => [],
                ];
            }
        }

        // If command was meant to list all tests, output the detailed
        // list instead of running through them.
        if ($this->listTests) {
            $this->writeProgress(array_values($this->all));
            $this->printEndDelimiter();
            exit;
        }
    }

    /**
     * A single test ended.
     *
     * @param \PHPUnit\Framework\Test $test
     * @param float $time
     * @return void
     */
    public function endTest(Test $test, float $time): void
    {
        if (!$this->lastTestFailed) {
            $this->addSuccess($test, $time);
        }

        $this->lastTestFailed = false;
    }

    /**
     * Output successful test result.
     *
     * @param \PHPUnit\Framework\Test $test
     * @param float $time
     * @return void
     */
    public function addSuccess(Test $test, float $time): void
    {
        $this->writeProgress($this->transformTest($test, null, $time));
    }

    /**
     * Output error test result.
     *
     * @param \PHPUnit\Framework\Test $test
     * @param \Throwable $t
     * @param float $time
     * @return void
     */
    public function addError(Test $test, Throwable $t, float $time): void
    {
        $this->writeProgress($this->transformTest($test, $t, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Output failed test result.
     *
     * @param \PHPUnit\Framework\Test $test
     * @param \PHPUnit\Framework\AssertionFailedError $t
     * @param float $time
     * @return void
     */
    public function addFailure(Test $test, AssertionFailedError $t, float $time): void
    {
        $this->writeProgress($this->transformTest($test, $t, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Output warning test result.
     *
     * @param \PHPUnit\Framework\Test $test
     * @param \PHPUnit\Framework\Warning $t
     * @param float $time
     * @return void
     */
    public function addWarning(Test $test, Warning $t, float $time): void
    {
        $this->writeProgress($this->transformTest($test, $t, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Output incomplete test result.
     *
     * @param \PHPUnit\Framework\Test $test
     * @param \Throwable $t
     * @param float $time
     * @return void
     */
    public function addIncompleteTest(Test $test, \Throwable $t, float $time): void
    {
        $this->writeProgress($this->transformTest($test, $t, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Output risky test result.
     *
     * @param \PHPUnit\Framework\Test $test
     * @param \Throwable $t
     * @param float $time
     * @return void
     */
    public function addRiskyTest(Test $test, \Throwable $t, float $time): void
    {
        $this->writeProgress($this->transformTest($test, $t, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Output skipped test result.
     *
     * @param \PHPUnit\Framework\Test $test
     * @param \Throwable $t
     * @param float $time
     * @return void
     */
    public function addSkippedTest(Test $test, \Throwable $t, float $time): void
    {
        $this->writeProgress($this->transformTest($test, $t, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Standardise test results for Lode app consumption.
     *
     * @param \PHPUnit\Framework\Test $test
     * @param \Throwable|null $t
     * @param float $time
     * @return array
     */
    protected function transformTest(Test $test, Throwable $t = null, float $time): array
    {
        $reflector = new ReflectionClass(get_class($test));

        $current = [
            'name' => $test->getName(),
            'displayName' => $this->transformName($test->getName()),
            'status' => $this->transformStatus($test->getStatus()),
            'feedback' => [
                'message' => $t ? $this->transformException($t) : $t,
                'type' => 'object',
            ],
            'stats' => [
                'duration' => round($time * 1000), // In milliseconds
                'assertions' => $test->getNumAssertions(),
            ],
            'console' => [],
            'isLast' => false,
        ];

        if (isset($this->all[$reflector->getFileName()]) && isset($this->all[$reflector->getFileName()]['tests'])) {
            $last = array_values(array_slice($this->all[$reflector->getFileName()]['tests'], -1))[0];
            if (isset($last['name']) && $last['name'] === $test->getName()) {
                $current['isLast'] = true;
            }
        }

        return [
            'file' => $reflector->getFileName(),
            'tests' => [$current],
            'meta' => [
                'class' => get_class($test),
                'groups' => $test->getGroups(),
            ],
        ];
    }

    /**
     * Make a test's name more human-readable.
     *
     * @param string $name
     * @return string
     */
    protected function transformName(string $name): string
    {
        return preg_replace('/^it\s/', '', $this->prettifier->prettifyTestMethod($name));
    }

    /**
     * Map a PHPUnit status string into a standardized
     * Lode status string.
     *
     * @param string $name
     * @return string
     */
    protected function transformStatus(int $status): string
    {
        return array_get($this->statuses, $status, 'warning');
    }

    /**
     * Transform the exception into something Lode can consume
     *
     * @param \Throwable $t
     * @return array
     */
    protected function transformException(Throwable $t): array
    {
        return [
            'message' => $t->getMessage(),
            'exception' => get_class($t),
            'file' => $t->getFile(),
            'line' => $t->getLine(),
            'trace' => $t->getTrace(),
        ];
    }

    /**
     * Output encoded progress.
     *
     * @param \Throwable $t
     * @return array
     */
    protected function writeProgress($progress): void
    {
        if ($this->pristine) {
            $this->printStartDelimiter();
        }

        $encoded = base64_encode(json_encode($progress));
        $this->write("({$encoded})");
        $this->writeNewLine();
    }

    /**
     * All tests have run, print results.
     *
     * After all tests have run, instead of printing resulsts,
     * which we've done in real-time, we just output the end
     * delimiter to let Lode know we're done.
     *
     * @param \PHPUnit\Framework\TestResult $result
     * @return void
     */
    public function printResult(TestResult $result): void
    {
        $this->printEndDelimiter();
    }

    /**
     * Print a Lode reporter's start limiter.
     *
     * @return void
     */
    protected function printStartDelimiter(): void
    {
        $this->writeNewLine();
        $this->write('{');
        $this->writeNewLine();

        $this->pristine = false;
    }

    /**
     * Print a Lode reporter's end limiter.
     *
     * @return void
     */
    protected function printEndDelimiter(): void
    {
        $this->write('}');
        $this->writeNewLine();
    }
}
