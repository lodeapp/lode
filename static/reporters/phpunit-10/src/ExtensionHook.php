<?php

declare(strict_types=1);

namespace LodeApp\PHPUnit;

use PHPUnit\Event\TestRunner\Configured;
use PHPUnit\Event\TestRunner\ConfiguredSubscriber;
use PHPUnit\Runner\Extension\ExtensionBootstrapper;
use PHPUnit\Runner\Extension\Facade as ExtensionFacade;

final class ExtensionHook implements ConfiguredSubscriber
{
    public function notify(Configured $event): void
    {
        $facade = new ExtensionFacade;

        $extensionBootstrapper = new ExtensionBootstrapper(
            $event->configuration(),
            $facade,
        );

        $extensionBootstrapper->bootstrap(Extension::class, []);
    }
}
