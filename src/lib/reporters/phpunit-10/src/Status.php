<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit;

use PHPUnit\Event\Event;
use PHPUnit\Event\Test;

enum Status: string
{
    case EMPTY = 'empty';
    case FAILED = 'failed';
    case IDLE = 'idle';
    case INCOMPLETE = 'incomplete';
    case PASSED = 'passed';
    case SKIPPED = 'skipped';
    case WARNING = 'warning';

    public static function fromEvent(Event $event): self
    {
        return match (get_class($event)) {
            Test\ConsideredRisky::class => self::EMPTY,
            Test\Errored::class => self::FAILED,
            Test\Failed::class => self::FAILED,
            Test\Failed::class => self::FAILED,
            Test\MarkedIncomplete::class => self::INCOMPLETE,
            Test\Passed::class => self::PASSED,
            Test\Skipped::class => self::SKIPPED,
            Test\PhpunitDeprecationTriggered::class => self::WARNING,
        };
    }
}
