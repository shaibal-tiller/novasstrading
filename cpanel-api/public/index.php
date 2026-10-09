<?php
require __DIR__ . '/../vendor/autoload.php';

$env = __DIR__ . '/../.env.php';
if (file_exists($env)) {
    require $env; // sets env vars via putenv() on the live cPanel server; not committed
}

$request = App\Http\Request::fromGlobals();
$response = App\Router::dispatch($request);
$response->send();

