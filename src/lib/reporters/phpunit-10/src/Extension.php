<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit;

use LodeApp\PHPUnit\Subscriber;
use PHPUnit\Runner\Extension\Extension as BaseExtension;
use PHPUnit\Runner\Extension\Facade;
use PHPUnit\Runner\Extension\ParameterCollection;
use PHPUnit\TextUI\Configuration\Configuration;
use PHPUnit\TextUI\Output\DefaultPrinter;

final class Extension implements BaseExtension
{
    public function bootstrap(
        Configuration $configuration,
        Facade $facade,
        ParameterCollection $parameters
    ): void
    {
        $printer = $configuration->outputToStandardErrorStream()
            ? DefaultPrinter::standardError()
            : DefaultPrinter::standardOutput();

        $reporter = new LodeReporter($configuration, $printer);

        $subscribers = [
            new Subscriber\ApplicationFinishedSubscriber($reporter),
            new Subscriber\TestConsideredRiskySubscriber($reporter),
            new Subscriber\TestDeprecationTriggeredSubscriber($reporter),
            new Subscriber\TestErroredSubscriber($reporter),
            new Subscriber\TestErrorTriggeredSubscriber($reporter),
            new Subscriber\TestFailedSubscriber($reporter),
            new Subscriber\TestFinishedSubscriber($reporter),
            new Subscriber\TestMarkedIncompleteSubscriber($reporter),
            new Subscriber\TestNoticeTriggeredSubscriber($reporter),
            new Subscriber\TestPassedSubscriber($reporter),
            new Subscriber\TestPhpDeprecationTriggeredSubscriber($reporter),
            new Subscriber\TestPhpNoticeTriggeredSubscriber($reporter),
            new Subscriber\TestPhpunitDeprecationTriggeredSubscriber($reporter),
            new Subscriber\TestPhpunitErrorTriggeredSubscriber($reporter),
            new Subscriber\TestPhpunitWarningTriggeredSubscriber($reporter),
            new Subscriber\TestPhpWarningTriggeredSubscriber($reporter),
            new Subscriber\TestSkippedSubscriber($reporter),
            new Subscriber\TestSuiteStartedSubscriber($reporter),
            new Subscriber\TestWarningTriggeredSubscriber($reporter),
        ];

        $facade->registerSubscribers(...$subscribers);
    }
}
