<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\Test\NoticeTriggered;
use PHPUnit\Event\Test\NoticeTriggeredSubscriber;

final class TestNoticeTriggeredSubscriber extends Subscriber implements NoticeTriggeredSubscriber
{
    public function notify(NoticeTriggered $event): void
    {
        $this->reporter()->handleEvent($event);
    }
}
