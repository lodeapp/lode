<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\Test\PhpunitWarningTriggered;
use PHPUnit\Event\Test\PhpunitWarningTriggeredSubscriber;

final class TestPhpunitWarningTriggeredSubscriber extends Subscriber implements PhpunitWarningTriggeredSubscriber
{
    public function notify(PhpunitWarningTriggered $event): void
    {
        $this->reporter()->handleEvent($event);
    }
}
