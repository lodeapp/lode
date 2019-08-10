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
        if (
            class_exists('PHPUnit_Runner_Version') &&
            (stripos(\PHPUnit_Runner_Version::id(), '5.') === 0 || stripos(\PHPUnit_Runner_Version::id(), '4.') === 0)
        ) {
            if ($class === 'LodeApp\PHPUnit\LodeReporter' || $class === 'LodeApp\PHPUnit\Report') {
                $folder = DIRECTORY_SEPARATOR . '48-57';
            }
        } else if (class_exists('PHPUnit\Runner\Version') && stripos(\PHPUnit\Runner\Version::id(), '6.') === 0) {
            if ($class === 'LodeApp\PHPUnit\LodeReporter') {
                $folder = DIRECTORY_SEPARATOR . '60-65';
            }
        }

        include_once __DIR__ . DIRECTORY_SEPARATOR . 'src' . $folder . str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen('LodeApp\PHPUnit')) . '.php');
    }
});

// Remember actual bootstrap location in case PHPUnit boots another process
// for tests running in isolation.
file_put_contents(__DIR__ . DIRECTORY_SEPARATOR . 'bootstrap', $bootstrap);

// Now that Lode is setup, require the original user-defined bootstrap.
require_once preg_replace($pattern, '', $bootstrap);
