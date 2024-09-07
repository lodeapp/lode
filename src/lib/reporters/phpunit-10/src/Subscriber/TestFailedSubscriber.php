<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\Test\Failed;
use PHPUnit\Event\Test\FailedSubscriber;

final class TestFailedSubscriber extends Subscriber implements FailedSubscriber
{
    public function notify(Failed $event): void
    {
        $this->reporter()->handleEvent($event);
    }
}
