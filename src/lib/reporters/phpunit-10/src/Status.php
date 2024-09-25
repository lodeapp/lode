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
            Test\DeprecationTriggered::class => self::WARNING,
            Test\Errored::class => self::FAILED,
            Test\ErrorTriggered::class => self::WARNING,
            Test\Failed::class => self::FAILED,
            Test\MarkedIncomplete::class => self::INCOMPLETE,
            Test\NoticeTriggered::class => self::WARNING,
            Test\Passed::class => self::PASSED,
            Test\PhpDeprecationTriggered::class => self::WARNING,
            Test\PhpNoticeTriggered::class => self::WARNING,
            Test\PhpunitDeprecationTriggered::class => self::WARNING,
            Test\PhpunitErrorTriggered::class => self::WARNING,
            Test\PhpunitWarningTriggered::class => self::WARNING,
            Test\PhpWarningTriggered::class => self::WARNING,
            Test\Skipped::class => self::SKIPPED,
            Test\WarningTriggered::class => self::WARNING,
        };
    }
}
