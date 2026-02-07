<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\Test\PhpNoticeTriggered;
use PHPUnit\Event\Test\PhpNoticeTriggeredSubscriber;

final class TestPhpNoticeTriggeredSubscriber extends Subscriber implements PhpNoticeTriggeredSubscriber
{
    public function notify(PhpNoticeTriggered $event): void
    {
        $this->reporter()->handleEvent($event);
    }
}
