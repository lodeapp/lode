<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\Test\PhpunitErrorTriggered;
use PHPUnit\Event\Test\PhpunitErrorTriggeredSubscriber;

final class TestPhpunitErrorTriggeredSubscriber extends Subscriber implements PhpunitErrorTriggeredSubscriber
{
    public function notify(PhpunitErrorTriggered $event): void
    {
        $this->reporter()->handleEvent($event);
    }
}
