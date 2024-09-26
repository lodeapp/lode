<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use PHPUnit\Event\Test\Passed;
use PHPUnit\Event\Test\PassedSubscriber;

final class TestPassedSubscriber extends Subscriber implements PassedSubscriber
{
    public function notify(Passed $event): void
    {
        $this->reporter()->handleEvent($event);
    }
}
