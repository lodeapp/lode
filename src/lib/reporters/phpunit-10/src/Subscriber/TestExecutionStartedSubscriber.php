<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\TestRunner\ExecutionStarted;
use PHPUnit\Event\TestRunner\ExecutionStartedSubscriber;

final class TestExecutionStartedSubscriber extends Subscriber implements ExecutionStartedSubscriber
{
    public function notify(ExecutionStarted $event): void
    {
        $this->reporter()->startTestSuite($event->testSuite());
    }
}
