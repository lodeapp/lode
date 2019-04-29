<?php

namespace LodeApp\PHPUnit;

use Exception;
use PHPUnit_Framework_AssertionFailedError;
use PHPUnit_Framework_Test;
use PHPUnit_Framework_TestResult;
use PHPUnit_Framework_TestSuite;
use PHPUnit_Framework_Warning;
use PHPUnit_TextUI_ResultPrinter;
use PHPUnit_Util_TestSuiteIterator;
use RecursiveIteratorIterator;

class LodeReporter extends PHPUnit_TextUI_ResultPrinter
{
    /**
     * If true, flush output after every write.
     *
     * @var bool
     */
    protected $autoFlush = true;

    /**
     * The maximum chunk size. We'll break them into
     * smaller chunks if above the limit, but it's not
     * guaranteed that PHPUnit will flush them as needed.
     *
     * Leave null to avoid splitting.
     *
     * @var bool
     */
    protected $chunkLimit = null;

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
     * @param \PHPUnit_Framework_TestSuite $suite
     */
    public function startTestSuite(PHPUnit_Framework_TestSuite $suite)
    {
        // Before starting, compile a detailed list of all the tests we'll run.
        // This helps us output pointers regarding the progress of each test group.
        foreach (new RecursiveIteratorIterator(new PHPUnit_Util_TestSuiteIterator($suite)) as $test) {
            $report = new Report($test);
            $filename = $report->getFileName();

            // Only add if it suite doesn't already exist.
            if (!isset($this->all[$filename])) {
                $this->all[$filename] = $report->hydrateSuite([]);
            }

            // Only add if it test doesn't already exist.
            if (array_search($report->getName(), array_column($this->all[$filename]['tests'], 'name')) === false) {
                if ($report->isWarning() && $report->isEmpty()) {
                    continue;
                }

                $this->all[$filename]['tests'][] = $report->hydrateTest();
            }
        }

        // If command was meant to list all tests, output the detailed
        // list instead of running through them.
        if ($this->listTests) {
            $this->progress(array_values($this->all));
            $this->printEndDelimiter();
            exit;
        }
    }

    /**
     * A single test ended.
     *
     * @param \PHPUnit_Framework_Test $test
     * @param float $time
     */
    public function endTest(PHPUnit_Framework_Test $test, $time)
    {
        if (!$this->lastTestFailed) {
            $this->addSuccess($test, $time);
        }

        $this->lastTestFailed = false;
    }

    /**
     * Output successful test result.
     *
     * @param \PHPUnit_Framework_Test $test
     * @param float $time
     */
    public function addSuccess(PHPUnit_Framework_Test $test, $time)
    {
        $this->progress($this->render($test, null, $time));
    }

    /**
     * Output error test result.
     *
     * @param \PHPUnit_Framework_Test $test
     * @param \Exception $e
     * @param float $time
     */
    public function addError(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
        $this->progress($this->render($test, $e, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Output failed test result.
     *
     * @param \PHPUnit_Framework_Test $test
     * @param \PHPUnit_Framework_AssertionFailedError $e
     * @param float $time
     */
    public function addFailure(PHPUnit_Framework_Test $test, PHPUnit_Framework_AssertionFailedError $e, $time)
    {
        $this->progress($this->render($test, $e, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Output warning test result.
     *
     * @param \PHPUnit_Framework_Test $test
     * @param \PHPUnit_Framework_Warning $e
     * @param float $time
     */
    public function addWarning(PHPUnit_Framework_Test $test, PHPUnit_Framework_Warning $e, $time)
    {
        $this->progress($this->render($test, $e, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Output incomplete test result.
     *
     * @param \PHPUnit_Framework_Test $test
     * @param \Exception $e
     * @param float $time
     */
    public function addIncompleteTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
        $this->progress($this->render($test, $e, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Output risky test result.
     *
     * @param \PHPUnit_Framework_Test $test
     * @param \Exception $e
     * @param float $time
     */
    public function addRiskyTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
        $this->progress($this->render($test, $e, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Output skipped test result.
     *
     * @param \PHPUnit_Framework_Test $test
     * @param \Exception $e
     * @param float $time
     */
    public function addSkippedTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
        $this->progress($this->render($test, $e, $time));
        $this->lastTestFailed = true;
    }

    /**
     * Render a test report.
     *
     * @param \PHPUnit_Framework_Test $test
     * @param \Exception|null $t
     * @param float $time
     */
    protected function render($test, Exception $t = null, $time)
    {
        $report = new Report($test);

        if ($t) {
            $report->withException($t);
        }

        $filename = $report->getFileName();
        if (isset($this->all[$filename]) && isset($this->all[$filename]['tests'])) {
            $values = array_values(array_slice($this->all[$filename]['tests'], -1));
            $last = isset($values[0]) ? $values[0] : false;
            if ($last && isset($last['name']) && $last['name'] === $report->getName()) {
                $report->setIsLast(true);
            }
        }

        return $report->setTime($time)->render();
    }

    /**
     * Encode progress before writing.
     *
     * @param array $progress
     */
    protected function progress(array $progress)
    {
        $encoded = base64_encode(json_encode($progress));
        $this->writeProgress("({$encoded})");
    }

    /**
     * Output the given progress.
     *
     * @param string $progress
     */
    protected function writeProgress($progress)
    {
        if ($this->pristine) {
            $this->printStartDelimiter();
        }

        // Split large chunks, if necessary.
        if ($this->chunkLimit && strlen($progress) > $this->chunkLimit) {
            foreach(explode("\r\n", chunk_split($progress, $this->chunkLimit)) as $chunk) {
                $this->write($chunk);
            }
        } else {
            $this->write($progress);
        }

        $this->writeNewLine();
    }

    /**
     * All tests have run, print results.
     *
     * After all tests have run, instead of printing resulsts,
     * which we've done in real-time, we just output the end
     * delimiter to let Lode know we're done.
     *
     * @param \PHPUnit_Framework_TestResult $result
     */
    public function printResult(PHPUnit_Framework_TestResult $result)
    {
        if ($this->pristine) {
            $this->printStartDelimiter();
        }

        $this->printEndDelimiter();
    }

    /**
     * Print a Lode reporter's start limiter.
     */
    protected function printStartDelimiter()
    {
        $this->writeNewLine();
        $this->write('<<<REPORT{');
        $this->writeNewLine();

        $this->pristine = false;
    }

    /**
     * Print a Lode reporter's end limiter.
     */
    protected function printEndDelimiter()
    {
        $this->write('}REPORT>>>');
        $this->writeNewLine();
    }
}
