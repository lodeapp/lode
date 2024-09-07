<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit;

use PHPUnit\Event\Event;
use PHPUnit\Event\Test;
use PHPUnit\Event\TestSuite\TestSuite;
use PHPUnit\TextUI\Configuration\Configuration;
use PHPUnit\TextUI\Output\DefaultPrinter as Printer;

class LodeReporter
{
    /**
     * The maximum chunk size. We'll break them into
     * smaller chunks if above the limit, but it's not
     * guaranteed that PHPUnit will flush them as needed.
     *
     * Leave null to avoid splitting.
     */
    private ?bool $chunkLimit = null;

    /**
     * Whether the reporter has printed any output
     */
    private bool $pristine = true;

    /**
     * Whether to list all tests or report them.
     */
    private bool $listTests = false;

    /**
     * The complete test list array
     */
    private array $all = [];

    /**
     * The list of tests with reported issues
     */
    private array $issues = [];

    /**
     * Create a new Lode reporter instance.
     */
    public function __construct(private Configuration $configuration, private Printer $printer)
    {
        // Since we have no way of natively listing all tests and
        // columns setting is of no use, define an arbitrary
        // number which will signify our custom command.
        if ($configuration->columns() === 42) {
            $this->listTests = true;
        }
    }

    /**
     * A test suite has started.
     *
     * If we're listing tests, not running them, we'll
     * hijack this function to print them immediately,
     * then abort execution.
     */
    public function startTestSuite(TestSuite $suite): void
    {
        $files = 0;
        // Before starting, compile a detailed list of all the tests we'll run.
        // This helps us output pointers regarding the progress of each test group.
        foreach ($suite->tests()->getIterator() as $test) {
            $report = new Report($test);
            $filename = $report->getFileName();

            // Only add if it suite doesn't already exist.
            if (!isset($this->all[$filename])) {
                $files++;
                $report->setOrder($files);
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
     * Handle a PHPUnit event.
     */
    public function handleEvent(Event $event): void
    {
        match (get_class($event)) {
            Test\Errored::class => $this->handleOutcomeEvent($event),
            Test\Failed::class => $this->handleOutcomeEvent($event),
            Test\MarkedIncomplete::class => $this->handleOutcomeEvent($event),
            Test\Passed::class => $this->handleOutcomeEvent($event),
            Test\Skipped::class => $this->handleOutcomeEvent($event),
            Test\ConsideredRisky::class => $this->handleIssueEvent($event),
            Test\DeprecationTriggered::class => $this->handleIssueEvent($event),
            Test\ErrorTriggered::class => $this->handleIssueEvent($event),
            Test\NoticeTriggered::class => $this->handleIssueEvent($event),
            Test\PhpDeprecationTriggered::class => $this->handleIssueEvent($event),
            Test\PhpNoticeTriggered::class => $this->handleIssueEvent($event),
            Test\PhpunitDeprecationTriggered::class => $this->handleIssueEvent($event),
            Test\PhpunitErrorTriggered::class => $this->handleIssueEvent($event),
            Test\PhpunitWarningTriggered::class => $this->handleIssueEvent($event),
            Test\PhpWarningTriggered::class => $this->handleIssueEvent($event),
            Test\WarningTriggered::class => $this->handleIssueEvent($event),
        };
    }

    /**
     * Handle a PHPUnit outcome event.
     */
    private function handleOutcomeEvent(Event $event): void
    {
        $report = new Report($event->test(), Status::fromEvent($event));

        if (method_exists($event, 'throwable')) {
            $report->withException($event->throwable());
        }

        if (method_exists($event, 'hasComparisonFailure') && $event->hasComparisonFailure()) {
            $report->withComparison($event->comparisonFailure());
        }

        $report->setDuration($event->telemetryInfo()->durationSincePrevious());

        $filename = $report->getFileName();
        if (isset($this->all[$filename]) && isset($this->all[$filename]['tests'])) {
            $values = array_values(array_slice($this->all[$filename]['tests'], -1));
            $last = isset($values[0]) ? $values[0] : false;
            if ($last && isset($last['name']) && $last['name'] === $report->getName()) {
                $report->setIsLast(true);
            }
        }

        $filenames = array_keys($this->all);
        $n = array_search($filename, $filenames);
        if ($n !== false) {
            $report->setOrder($n + 1);
        }

        $this->progress($report->render());
    }

    /**
     * Handle a PHPUnit issue event.
     */
    private function handleIssueEvent(Event $event): void
    {
        $report = new Report($event->test(), Status::fromEvent($event));
        // $this->progress($report->render());
    }

    /**
     * All tests have run, print results.
     *
     * After all tests have run, instead of printing resulsts,
     * which we've done in real-time, we just output the end
     * delimiter to let Lode know we're done.
     */
    public function printResult(): void
    {
        if ($this->pristine) {
            $this->printStartDelimiter();
        }

        $this->printEndDelimiter();
    }

    /**
     * Output the given string.
     */
    public function write(string $buffer): void
    {
        $this->printer->print($buffer);
    }

    /**
     * Output the given progress.
     */
    private function progress(array $progress): void
    {
        $encoded = base64_encode(json_encode($progress));
        $this->writeChunkedProgress("({$encoded})");
    }

    /**
     * Output the given progress, splitting in chunks if necessary.
     */
    private function writeChunkedProgress(string $progress): void
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
     * Print a Lode reporter's start limiter.
     */
    private function printStartDelimiter(): void
    {
        $this->writeNewLine();
        $this->write('<<<REPORT{');
        $this->writeNewLine();

        $this->pristine = false;
    }

    /**
     * Print a Lode reporter's end limiter.
     */
    private function printEndDelimiter(): void
    {
        $this->write('}REPORT>>>');
        $this->writeNewLine();
    }

    /**
     * Print new line to the output.
     */
    private function writeNewLine(): void
    {
        $this->write("\n");
    }
}
