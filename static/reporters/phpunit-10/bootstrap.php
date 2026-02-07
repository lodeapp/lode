<?php

try {
    $pattern = '/^lode_bootstrap=/i';
    $bootstrap = isset(array_values(preg_grep($pattern, $_SERVER['argv']))[0]) ? array_values(preg_grep($pattern, $_SERVER['argv']))[0] : false;
    if (!$bootstrap) {
        // If we've already bootstrapped Lode before, we should be able to
        // retrieve the bootstrap location again. Otherwise, fail.
        $bootstrap = file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . 'bootstrap', $bootstrap);
        if ($bootstrap === false) {
            throw new Exception;
        }
    }
} catch (Exception $e) {
    echo('Unable to locate bootstrap file. Have you configured it in your Lode framework settings?');
    exit(1);
}

spl_autoload_register(function ($class) {
    if (stripos($class, 'LodeApp\PHPUnit') === 0) {
        $folder = '';
        include_once __DIR__ . DIRECTORY_SEPARATOR . 'src' . $folder . str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen('LodeApp\PHPUnit')) . '.php');
    }
});

if (!function_exists('console')) {
    function console() {
        call_user_func_array([\LodeApp\PHPUnit\Console::class, 'log'], func_get_args());
    }
}

// On PHPUnit 10+, extending must be done using classes that implement an interface, so check for that
// and manually require the class, so Lode doesn't need to modify the application's configuration files.
if (interface_exists('\PHPUnit\Runner\Extension\Extension')) {
    // Bootstrap the Lode extension for PHPUnit 10+
    $facade = \PHPUnit\Event\Facade::instance();
    $facade->registerSubscriber(new \LodeApp\PHPUnit\ExtensionHook());
}

// Remember actual bootstrap location in case PHPUnit boots another process
// for tests running in isolation.
file_put_contents(__DIR__ . DIRECTORY_SEPARATOR . 'bootstrap', $bootstrap);

// Now that Lode is set up, require the original user-defined bootstrap.
require_once preg_replace($pattern, '', $bootstrap);
