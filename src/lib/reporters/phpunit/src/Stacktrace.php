<?php

/*
Adapted from Bugsnag's PHP package.
----------------------------------------------------------------
Copyright (c) 2013 Bugsnag
----------------------------------------------------------------
For licensing information, see Open Source Notices in Lode app.
*/

namespace LodeApp\PHPUnit;

use RuntimeException;
use SplFileObject;

class Stacktrace
{
    /**
     * The default number of lines of code to include.
     *
     * @var int
     */
    const NUM_LINES = 7;

    /**
     * The default maximum line length for included code.
     *
     * @var int
     */
    const MAX_LENGTH = 200;

    /**
     * The array of frames.
     *
     * @var array
     */
    protected $frames = [];

    /**
     * Transform a native PHP backtrace into a richer one
     * with code snippets.
     *
     * @param array $trace
     * @return array
     */
    public static function transform($trace)
    {
        return array_values(Util::compact(
            array_map(function ($frame) {
                return Util::compact([
                    'file' => Util::get($frame, 'file', null),
                    'line' => Util::get($frame, 'lineNumber', null),
                    'code' => Util::get($frame, 'code', null),
                ]);
            }, static::fromBacktrace($trace, 0, 0)->getFrames())
        ));
    }

    /**
     * Create a new stacktrace instance from a backtrace.
     *
     * @param array $backtrace
     * @param int $topFile
     * @param int $topLine
     *
     * @return static
     */
    public static function fromBacktrace(array $backtrace, $topFile, $topLine)
    {
        $stacktrace = new static;

        // PHP backtrace's are misaligned, we need to shift the file/line down a frame
        foreach ($backtrace as $frame) {
            $stacktrace->addFrame(
                $topFile,
                $topLine,
                isset($frame['function']) ? $frame['function'] : null,
                isset($frame['class']) ? $frame['class'] : null
            );

            if (isset($frame['file']) && isset($frame['line'])) {
                $topFile = $frame['file'];
                $topLine = $frame['line'];
            } else {
                $topFile = '[internal]';
                $topLine = 0;
            }
        }

        // Add a final stackframe for the "main" method
        $stacktrace->addFrame($topFile, $topLine, '[main]');

        return $stacktrace;
    }

    /**
     * Get the array representation.
     *
     * @return array
     */
    public function &toArray()
    {
        return $this->frames;
    }

    /**
     * Get the stacktrace frames.
     *
     * This is the same as calling toArray.
     *
     * @return array
     */
    public function &getFrames()
    {
        return $this->frames;
    }

    /**
     * Add the given frame to the stacktrace.
     *
     * @param string      $file   the associated file
     * @param int         $line   the line number
     * @param string      $method the method called
     * @param string|null $class  the associated class
     *
     * @return void
     */
    public function addFrame($file, $line, $method, $class = null)
    {
        // Account for special "filenames" in eval'd code
        $matches = [];
        if (preg_match("/^(.*?)\((\d+)\) : (?:eval\(\)'d code|runtime-created function)$/", $file, $matches)) {
            $file = $matches[1];
            $line = $matches[2];
        }

        // Construct the frame
        $frame = [
            'lineNumber' => (int) $line,
            'method' => $class ? "$class::$method" : $method,
        ];

        // Attach some lines of code for context
        $frame['code'] = $this->getCode($file, $line, static::NUM_LINES);

        $frame['file'] = $file;

        $this->frames[] = $frame;
    }

    /**
     * Extract the code for the given file and lines.
     *
     * @param string $path     the path to the file
     * @param int    $line     the line to centre about
     * @param string $numLines the number of lines to fetch
     *
     * @return string[]|null
     */
    protected function getCode($path, $line, $numLines)
    {
        if (empty($path) || empty($line) || !file_exists($path)) {
            return;
        }

        try {
            $file = new SplFileObject($path);
            $file->seek(PHP_INT_MAX);

            $bounds = static::getBounds($line, $numLines, $file->key() + 1);

            $code = [];

            $file->seek($bounds[0] - 1);
            while ($file->key() < $bounds[1]) {
                $code[$file->key() + 1] = rtrim(substr($file->current(), 0, static::MAX_LENGTH));
                $file->next();
            }

            return $code;
        } catch (RuntimeException $ex) {
            // do nothing
        }
    }

    /**
     * Get the start and end positions for the given line.
     *
     * @param int    $line the line to centre about
     * @param string $num  the number of lines to fetch
     * @param int    $max  the maximum line number
     *
     * @return int[]
     */
    protected static function getBounds($line, $num, $max)
    {
        $start = max($line - floor($num / 2), 1);

        $end = $start + ($num - 1);

        if ($end > $max) {
            $end = $max;
            $start = max($end - ($num - 1), 1);
        }

        return [$start, $end];
    }
}
