<?php

namespace LodeApp\PHPUnit;

use PHPUnit\Framework\Test;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\TestResult;
use PHPUnit\Framework\TestSuite;
use PHPUnit\Runner\PhptTestCase;
use PHPUnit\TextUI\Command;
use PHPUnit\TextUI\ResultPrinter;
use PHPUnit\Util\TestDox\NamePrettifier;
use RecursiveIteratorIterator;
use ReflectionClass;
use Throwable;

class Reporter extends ResultPrinter
{
    protected $statuses = [
        0 => 'passed',     // PASSED
        1 => 'incomplete', // SKIPPED
        2 => 'incomplete', // INCOMPLETE
        3 => 'failed',     // FAILURE
        4 => 'failed',     // ERROR
        5 => 'incomplete', // RISKY
        6 => 'warning',    // WARNING
    ];

    protected $pristine = true;

    protected $listTests = false;

    protected $prettifier;

    /**
     * Constructor.
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

    public function printResult(TestResult $result): void
    {
        $this->printEndDelimiter();
    }

    /**
     * A test ended.
     */
    public function endTest(Test $test, float $time): void
    {
        if (!$this->lastTestFailed) {
            $this->addSuccess($test, $time);
        }

        $this->lastTestFailed = false;
    }

    /**
     * Success.
     */
    public function addSuccess(Test $test, float $time): void
    {
        $this->writeProgress($this->transformTest($test, null, $time));
    }

    /**
     * An error occurred.
     */
    public function addError(Test $test, Throwable $t, float $time): void
    {
        $this->writeProgress($this->transformTest($test, $t, $time));
        $this->lastTestFailed = true;
    }

    protected function transformTest(Test $test, Throwable $t = null, float $time): array
    {
        $reflector = new ReflectionClass(get_class($test));

        return [
            'file' => $reflector->getFileName(),
            'tests' => [
                [
                    'name' => $test->getName(),
                    'displayName' => $this->transformName($test->getName()),
                    'status' => $this->transformStatus($test->getStatus()),
                    'feedback' => $t ? $this->transformException($t) : $t,
                    'assertions' => $test->getNumAssertions(),
                    'console' => [],
                ]
            ],
            'meta' => [
                'class' => get_class($test),
                'groups' => $test->getGroups(),
            ],
        ];
    }

    protected function transformName(string $name): string
    {
        return preg_replace('/^it\s/', '', $this->prettifier->prettifyTestMethod($name));
    }

    protected function transformStatus(int $status): string
    {
        return array_get($this->statuses, $status, 'warning');
    }

    protected function transformException(Throwable $e): array
    {
        return [
            'message' => $e->getMessage(),
            'exception' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTrace(),
        ];
    }

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
     * A testsuite started.
     */
    public function startTestSuite(TestSuite $suite): void
    {
        if ($this->listTests) {
            $tests = [];
            foreach (new RecursiveIteratorIterator($suite->getIterator()) as $test) {
                $reflector = new ReflectionClass(get_class($test));
                $filename = $reflector->getFileName();

                if (!isset($tests[$filename])) {
                    $tests[$filename] = [
                        'file' => $reflector->getFileName(),
                        'tests' => [],
                        'meta' => [
                            'class' => get_class($test),
                            'groups' => $test->getGroups(),
                        ],
                    ];
                }

                $tests[$filename]['tests'][] = [
                    'name' => $test->getName(),
                    'displayName' => $this->transformName($test->getName()),
                    'status' => 'idle',
                    'feedback' => [],
                    'assertions' => 0,
                    'console' => [],
                ];
            }

            $this->writeProgress(array_values($tests));
            $this->printEndDelimiter();
            exit;
        }

    }

    protected function printStartDelimiter(): void
    {
        $this->writeNewLine();
        $this->write('{');
        $this->writeNewLine();

        $this->pristine = false;
    }

    protected function printEndDelimiter(): void
    {
        $this->write('}');
        $this->writeNewLine();
    }
}
