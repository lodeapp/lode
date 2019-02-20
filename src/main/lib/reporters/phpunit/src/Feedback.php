<?php

namespace LodeApp\PHPUnit;

use Exception;
use PHPUnit\Framework\Exception as PHPUnitException;
use PHPUnit\Framework\ExceptionWrapper;
use PHPUnit\Framework\ExpectationFailedException;
use PHPUnit\Framework\Warning;
use PHPUnit\Util\Filter;
use SebastianBergmann\Comparator\ComparisonFailure;
use Throwable;

class Feedback
{
    /**
     * The exception we're transforming.
     *
     * @var \Throwable
     */
    protected $exception;

    /**
     * Create a new Lode Feedback class.
     *
     * @param \Throwable $exception
     */
    public function __construct(Throwable $exception)
    {
        $this->exception = $exception;
    }

    /**
     * Get the feedback's title.
     *
     * @return string
     */
    protected function getTitle()
    {
        if ($this->exception instanceof ExceptionWrapper) {
            return $this->exception->getClassName();
        }

        return get_class($this->exception);
    }

    /**
     * Get the feedback's message.
     *
     * @return string
     */
    protected function getMessage()
    {
        return $this->exception->getMessage();
    }

    /**
     * Get the feedback's backtrace group.
     *
     * @return array
     */
    protected function getTrace()
    {
        $trace = [];
        $e = $this->exception;
        do {
            $trace[] = $this->getExceptionTrace($e);
        } while ($e = method_exists($e, 'getPreviousWrapped') ? $e->getPreviousWrapped() : $e->getPrevious());

        return $trace;
    }

    /**
     * Get the backtrace of a given exception object.
     *
     * @return array
     */
    protected function getExceptionTrace(Exception $e)
    {
        if ($e instanceof Warning) {
            $trace = $e->getSerializableTrace();
        } elseif ($e instanceof PHPUnitException) {
            // @see PHPUnit\Framework\Exception::__toString
            $trace = Filter::getFilteredStacktrace($e);
        } else {
            $trace = method_exists($e, 'getSerializableTrace')
            ? $e->getSerializableTrace()
            : $e->getTrace();
        }

        return $this->transformTrace($trace);
    }

    /**
     * Transform a given backtrace into a standardised Lode trace.
     *
     * @return array
     */
    protected function transformTrace($trace)
    {
        // Normalize the trace.
        if (is_string($trace)) {
            $trace = array_map(function ($item) {
                return array_combine(['file', 'line'], explode(':', $item));
            }, array_filter(explode("\n", $trace)));
        }

        try {
            // Attempt to get code snippets. If it fails, return original trace.
            return Stacktrace::transform($trace);
        } catch (Exception $e) {
            return $trace;
        }
    }

    /**
     * Get the feedback's diff, if any.
     *
     * @return string|null
     */
    protected function getDiff()
    {
        if ($this->exception instanceof ExpectationFailedException) {
            $comparison = $this->exception->getComparisonFailure();
            if ($comparison instanceof ComparisonFailure) {
                return preg_replace('/^\n/', '', $comparison->getDiff());
            }
        }

        return null;
    }

    /**
     * Transform the exception into something Lode can consume
     *
     * @return array
     */
    protected function transformContent()
    {
        return Util::compact([
            'title' => $this->getTitle(),
            'message' => $this->getMessage(),
            'diff' => $this->getDiff(),
            'trace' => $this->getTrace(),
        ]);
    }

    /**
     * Render the error as an array
     *
     * @return array
     */
    public function render()
    {
        return [
            'content' => $this->transformContent(),
            'type' => 'feedback',
        ];
    }
}
