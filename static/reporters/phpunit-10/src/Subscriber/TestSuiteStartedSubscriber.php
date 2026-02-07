<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\TestSuite\Started;
use PHPUnit\Event\TestSuite\StartedSubscriber;

final class TestSuiteStartedSubscriber extends Subscriber implements StartedSubscriber
{
    public function notify(Started $event): void
    {
        if (! $this->reporter()->startTestSuite($event->testSuite())) {
            exit;
        }
    }
}
