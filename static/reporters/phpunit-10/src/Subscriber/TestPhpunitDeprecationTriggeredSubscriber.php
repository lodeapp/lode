<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\Test\PhpunitDeprecationTriggered;
use PHPUnit\Event\Test\PhpunitDeprecationTriggeredSubscriber;

final class TestPhpunitDeprecationTriggeredSubscriber extends Subscriber implements PhpunitDeprecationTriggeredSubscriber
{
    public function notify(PhpunitDeprecationTriggered $event): void
    {
        $this->reporter()->handleEvent($event);
    }
}
