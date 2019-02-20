<?php

try {
    $pattern = '/^lode_bootstrap=/i';
    $bootstrap = array_values(preg_grep($pattern, $_SERVER['argv']))[0];
    if (!$bootstrap) {
        throw new Exception;
    }
} catch (\Exception $e) {
    echo('Unable to locate bootstrap file. Have you configured it in your Lode framework settings?');
    exit(1);
}

spl_autoload_register(function($class) {
    if (stripos($class, 'LodeApp\PHPUnit') === 0) {
        include_once __DIR__ . DIRECTORY_SEPARATOR. 'src' . str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen('LodeApp\PHPUnit')) . '.php');
    }
});

require_once preg_replace($pattern, '', $bootstrap);
