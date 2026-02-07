<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\Test\ErrorTriggered;
use PHPUnit\Event\Test\ErrorTriggeredSubscriber;

final class TestErrorTriggeredSubscriber extends Subscriber implements ErrorTriggeredSubscriber
{
    public function notify(ErrorTriggered $event): void
    {
        $this->reporter()->handleEvent($event);
    }
}
