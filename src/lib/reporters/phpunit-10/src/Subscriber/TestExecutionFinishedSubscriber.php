<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\TestRunner\ExecutionFinished;
use PHPUnit\Event\TestRunner\ExecutionFinishedSubscriber;

final class TestExecutionFinishedSubscriber extends Subscriber implements ExecutionFinishedSubscriber
{
    public function notify(ExecutionFinished $event): void
    {
        $this->reporter()->printResult();
    }
}
