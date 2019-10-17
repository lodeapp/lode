<?php

namespace LodeApp\PHPUnit;

use Exception;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class Console
{
    /**
     * The registered and not yet printed console logs.
     *
     * @var array
     */
    protected $logs = [];

    /**
     * Dump a variable or group of variables into the console.
     * Prints them with formatting, if possible.
     *
     * @return void
     */
    public static function log()
    {
        call_user_func_array([Lode::make(Console::class), 'write'], [func_get_args()]);
    }

    /**
     * Alias of @log.
     *
     * @return void
     */
    public static function dump()
    {
        call_user_func_array([Lode::make(Console::class), 'write'], [func_get_args()]);
    }

    /**
     * Print a variable or group of variables into the console
     * without any formatting.
     *
     * @return void
     */
    public static function print() {
        call_user_func_array([Lode::make(Console::class), 'write'], [func_get_args(), false]);
    }

    /**
     * Write a given set of variables into the console.
     *
     * @return void
     */
    protected function write($vars, $dump = true)
    {
        try {
            $context = [];
            // Find out which test called, to give logging some context.
            foreach (debug_backtrace() as $trace) {

                // Assume this is the original console call, where we'll get line and type.
                if (isset($trace['line']) && Util::get($trace, 'class') === Console::class) {
                    $context['line'] = $trace['line'];
                    $context['type'] = $trace['function'];
                    continue;
                }

                // And this to be the test method containing the console call.
                if (Util::get($trace, 'class') !== Console::class && Util::get($trace, 'object') instanceof TestCase) {
                    $log = '';

                    // Update context to contain suite and test.
                    $context = array_merge($context, [
                        'file' => (new ReflectionClass($trace['object']))->getFileName(),
                        'test' => $trace['function'],
                    ]);

                    if ($dump && class_exists(\Symfony\Component\VarDumper\Dumper\CliDumper::class)) {
                        // If the Symfony VarDumper package is available, use it,
                        // as it will provide richer feedback and color.
                        $cloner = new \Symfony\Component\VarDumper\Cloner\VarCloner;
                        $dumper = new \Symfony\Component\VarDumper\Dumper\CliDumper;
                        $dumper->setColors(true);
                        foreach ($vars as $index => $var) {
                            if ($index > 0) {
                                $log .= "\n";
                            }
                            $dumper->dump($cloner->cloneVar($var), function ($line, $depth) use (&$log) {
                                if ($depth >= 0) {
                                    // Indent with 2 spaces.
                                    $log .= str_repeat('  ', $depth) . $line . "\n";
                                }
                            });
                        }
                    } else {
                        // Fallback to native `print_r`.
                        foreach ($vars as $var) {
                            $log .= print_r($var, true) . "\n\n";
                        }
                    }

                    $this->writeToLog($context, $log);
                    break;
                }
            }
        } catch (Exception $e) {
            // Fail silently.
        }
    }

    /**
     * Write a variable into a specific context inside the console.
     *
     * @return void
     */
    protected function writeToLog(array $context, $log, $render = 'string')
    {
        if (!isset($this->logs[$context['file']])) {
            $this->logs[$context['file']] = [];
        }

        if (!isset($this->logs[$context['file']][$context['test']])) {
            $this->logs[$context['file']][$context['test']] = [];
        }

        $this->logs[$context['file']][$context['test']][] = [
            'file' => $context['file'],
            'type' => Util::get($context, 'type', 'log'),
            'line' => Util::get($context, 'line', null),
            'render' => Util::get($context, 'render', 'ansi'),
            'content' => $log,
        ];
    }

    /**
     * Get and remove logs of a given suite and test from the console.
     *
     * @return array
     */
    public function pullTestLogs(string $filename, string $test)
    {
        if (isset($this->logs[$filename]) && isset($this->logs[$filename][$test])) {
            $log = $this->logs[$filename][$test];
            unset($this->logs[$filename][$test]);
            return $log;
        }

        return [];
    }

    /**
     * Get and remove logs of a given suite from the console.
     * A log is considered to be from the suite if it was logged under
     * the suite's filename but doesn't match any of its test methods.
     *
     * @return array
     */
    public function pullSuiteLogs(string $filename)
    {
        if (isset($this->logs[$filename])) {
            $flat = [];
            $suiteLogs = $this->logs[$filename];
            unset($this->logs[$filename]);
            // Flatten the logs to remove the non-existent test keys.
            foreach ($suiteLogs as $method => $log) {
                return array_merge($flat, $log);
            }
            return $flat;
        }

        return [];
    }
}
