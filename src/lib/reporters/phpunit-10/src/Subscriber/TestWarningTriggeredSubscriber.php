<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\Test\WarningTriggered;
use PHPUnit\Event\Test\WarningTriggeredSubscriber;

final class TestWarningTriggeredSubscriber extends Subscriber implements WarningTriggeredSubscriber
{
    public function notify(WarningTriggered $event): void
    {
        $this->reporter()->handleEvent($event);
    }
}
