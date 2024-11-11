<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define("LARAVEL_START", microtime(true));

// Load maintenance mode if enabled
if (
    file_exists(
        $maintenance = __DIR__ . "/../storage/framework/maintenance.php"
    )
) {
    require $maintenance;
}

// Autoload dependencies
require __DIR__ . "/../vendor/autoload.php";

// Bootstrap the application
$app = require_once __DIR__ . "/../bootstrap/app.php";

$kernel = $app->make(Kernel::class);

$response = $kernel->handle($request = Request::capture())->send();

$kernel->terminate($request, $response);
