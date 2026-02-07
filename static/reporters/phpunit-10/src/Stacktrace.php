<?php

declare(strict_types=1);

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
    private $frames = [];

    /**
     * Transform a native PHP backtrace into a richer one
     * with code snippets.
     */
    public static function transform(array $trace): array
    {
        return array_values(Util::compact(
            array_map(function ($frame) {
                return Util::compact([
                    'file' => Util::get($frame, 'file', null),
                    'line' => Util::get($frame, 'lineNumber', null),
                    'code' => Util::get($frame, 'code', null),
                ]);
            }, static::fromBacktrace($trace, '', 0)->getFrames())
        ));
    }

    /**
     * Create a new stacktrace instance from a backtrace.
     */
    public static function fromBacktrace(array $backtrace, string $topFile, int $topLine): static
    {
        $stacktrace = new static;

        // PHP backtrace's are misaligned, we need to shift the file/line down a frame
        foreach ($backtrace as $frame) {
            $stacktrace->addFrame(
                $topFile,
                intval($topLine),
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
        $stacktrace->addFrame($topFile, intval($topLine), '[main]');

        return $stacktrace;
    }

    /**
     * Get the array representation.
     */
    public function &toArray(): array
    {
        return $this->frames;
    }

    /**
     * Get the stacktrace frames.
     *
     * This is the same as calling toArray.
     */
    public function &getFrames(): array
    {
        return $this->frames;
    }

    /**
     * Add the given frame to the stacktrace.
     */
    public function addFrame(string $file, int $line, ?string $method = null, ?string $class = null): void
    {
        if (!$file) {
            return;
        }

        // Account for special "filenames" in eval'd code
        $matches = [];
        if (preg_match("/^(.*?)\((\d+)\) : (?:eval\(\)'d code|runtime-created function)$/", (string) $file, $matches)) {
            $file = $matches[1];
            $line = intval($matches[2]);
        }

        // Construct the frame
        $frame = [
            'lineNumber' => $line,
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
     * @return string[]|null
     */
    private function getCode(string $path, int $line, int $numLines)
    {
        if (empty($path) || empty($line) || !file_exists($path)) {
            return;
        }

        try {
            $file = new SplFileObject($path);
            $file->seek((int) PHP_INT_MAX);

            $bounds = static::getBounds($line, $numLines, $file->key() + 1);

            $code = [];

            $file->seek(intval($bounds[0] - 1));
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
    private static function getBounds($line, $num, $max)
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
