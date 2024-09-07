<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit;

use Exception;
use PHPUnit\Event\Code\ComparisonFailure;
use PHPUnit\Event\Code\Throwable;

class Feedback
{
    /**
     * Create a new Lode Feedback class.
     */
    public function __construct(private Throwable $throwable, private ?ComparisonFailure $comparison = null)
    {
    }

    /**
     * Get the feedback's title.
     */
    private function getTitle(): string
    {
        return $this->throwable->className();
    }

    /**
     * Get the feedback's message.
     */
    private function getText(): string
    {
        return $this->throwable->message();
    }

    /**
     * Get the feedback's backtrace group.
     */
    private function getTrace(): array
    {
        $trace = [];
        $throwable = $this->throwable;
        do {
            $trace[] = $this->transformTrace($throwable->stackTrace());
            $throwable = $throwable->hasPrevious() ? $throwable->previous() : null;
        } while ($throwable);

        return Util::compact($trace);
    }

    /**
     * Transform a given backtrace into a standardised Lode trace.
     */
    private function transformTrace(string $trace): array
    {
        // Normalize the trace.
        $trace = array_map(function ($item) {
            return array_combine(['file', 'line'], [
                preg_replace('/:\d+$/mi', '', $item),
                preg_replace('/(.+):(\d+)$/mi', '$2', $item),
            ]);
        }, array_filter(explode("\n", $trace)));

        try {
            // Attempt to get code snippets. If it fails, return original trace.
            return Stacktrace::transform($trace);
        } catch (Exception $e) {
            return $trace;
        }
    }

    /**
     * Get the feedback's diff, if any.
     */
    private function getDiff(): ?array
    {
        if ($this->comparison) {
            return [
                '@' => preg_replace('/^\n/', '', $this->comparison->diff()),
                '-' => preg_replace('/^\n/', '', $this->comparison->expected()),
                '+' => preg_replace('/^\n/', '', $this->comparison->actual()),
            ];
        } else {
            // If PHPUnit doesn't create a ComparisonFailure, but this was, in fact,
            // a comparison, we'll attempt to parse it based on the message contents.
            // If we fail, no harm done, but if we succeed feedback is greatly improved.
            preg_match('/Failed asserting that \'(.+)\' contains (.+)\./imsU', $this->throwable->message(), $matches);
            if (count($matches)) {
                return Util::compact([
                    // Since this is not a proper expectation, just a partial
                    // string we searched for, use a different key so we
                    // can categorize it more appropriately.
                    'q' => preg_replace('/^\n/', '', Util::get($matches, 2)),
                    // Attempt to normalize line-breaks in case they were mangled
                    // in the process of building the message. This is especially
                    // important when detecting presence in HTML strings.
                    '+' => preg_replace('~\\\n\R~u', "\n", Util::get($matches, 1)),
                ]);
            }
        }

        return null;
    }

    /**
     * Transform the exception into something Lode can consume
     */
    private function transformContent(): array
    {
        return Util::compact([
            'title' => $this->getTitle(),
            'text' => $this->getText(),
            'diff' => $this->getDiff(),
            'trace' => $this->getTrace(),
        ]);
    }

    /**
     * Render the error as an array
     */
    public function render(): array
    {
        return [
            'content' => $this->transformContent(),
            'type' => 'feedback',
        ];
    }
}
