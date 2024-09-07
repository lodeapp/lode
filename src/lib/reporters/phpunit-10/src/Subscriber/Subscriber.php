<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit\Subscriber;

use LodeApp\PHPUnit\LodeReporter;

abstract class Subscriber
{
    /**
     * Creates a new Subscriber instance.
     */
    public function __construct(private readonly LodeReporter $reporter)
    {
    }

    /**
     * Get the reporter instance.
     */
    final protected function reporter(): LodeReporter
    {
        return $this->reporter;
    }
}
