<?php
namespace App;

use App\Controllers\AuthController;
use App\Controllers\ContentController;
use App\Controllers\ItemsController;
use App\Controllers\MediaController;
use App\Controllers\SectionsController;
use App\Controllers\StorageController;
use App\Http\Request;
use App\Http\Response;

final class Router
{
    public static function dispatch(Request $req): Response
    {
        $method = $req->method;
        $path = rtrim($req->path, '/') ?: '/';

        if ($method === 'GET' && $path === '/health') {
            return Response::json(['ok' => true]);
        }

        // Ops diagnostic: which PHP and image libraries is the WEB server really running?
        // (The CLI PHP and the web PHP are different builds on shared hosting.)
        if ($method === 'GET' && $path === '/diag') {
            if (!\App\Middleware\RequireApiKey::check($req)) {
                return Response::json(['error' => 'invalid api key'], 401);
            }
            return Response::json([
                'php' => PHP_VERSION,
                'sapi' => PHP_SAPI,
                'ini' => php_ini_loaded_file() ?: null,
                'memory_limit' => ini_get('memory_limit'),
                'extensions' => [
                    'gd' => extension_loaded('gd'),
                    'imagick' => extension_loaded('imagick'),
                    'exif' => extension_loaded('exif'),
                    'mbstring' => extension_loaded('mbstring'),
                    'pdo_mysql' => extension_loaded('pdo_mysql'),
                ],
                'webp_encoder' => function_exists('imagewebp') || class_exists('Imagick'),
            ]);
        }

        if ($method === 'POST' && $path === '/auth/login') {
            return (new AuthController())->login($req);
        }
        if ($method === 'POST' && $path === '/auth/otp/request') {
            return (new AuthController())->requestOtp($req);
        }
        if ($method === 'POST' && $path === '/auth/otp/verify') {
            return (new AuthController())->verifyOtp($req);
        }

        if ($method === 'GET' && $path === '/content') {
            return (new ContentController())->index($req);
        }

        if ($method === 'GET' && $path === '/sections') {
            return (new SectionsController())->index($req);
        }
        if (preg_match('#^/sections/([a-zA-Z0-9_-]+)$#', $path, $m)) {
            if ($method === 'PUT') {
                return (new SectionsController())->update($req, $m[1]);
            }
            if ($method === 'GET') {
                return (new SectionsController())->show($req, $m[1]);
            }
        }

        if ($method === 'GET' && $path === '/items') {
            return (new ItemsController())->index($req);
        }
        if ($method === 'POST' && $path === '/items') {
            return (new ItemsController())->create($req);
        }
        if ($method === 'PUT' && $path === '/items/reorder') {
            return (new ItemsController())->reorder($req);
        }
        if ($method === 'GET' && $path === '/items/trash') {
            return (new ItemsController())->trash($req);
        }
        if ($method === 'DELETE' && $path === '/items/trash') {
            return (new ItemsController())->emptyTrash($req);
        }
        if (preg_match('#^/items/(\d+)/purge$#', $path, $m) && $method === 'DELETE') {
            return (new ItemsController())->purge($req, (int) $m[1]);
        }
        if ($method === 'GET' && $path === '/storage') {
            return (new StorageController())->usage($req);
        }
        if ($method === 'POST' && $path === '/storage/cleanup') {
            return (new StorageController())->cleanup($req);
        }
        if (preg_match('#^/items/(\d+)/restore$#', $path, $m) && $method === 'PUT') {
            return (new ItemsController())->restore($req, (int) $m[1]);
        }
        if (preg_match('#^/items/(\d+)$#', $path, $m)) {
            $id = (int) $m[1];
            if ($method === 'PUT') {
                return (new ItemsController())->update($req, $id);
            }
            if ($method === 'DELETE') {
                return (new ItemsController())->delete($req, $id);
            }
        }

        // The upload folder is public/media/, so the bare path /media can be swallowed by the
        // web server's own "add a trailing slash to a directory" redirect (301) before PHP
        // runs. /media-library is the same API with no such folder behind it - clients use it.
        if ($method === 'GET' && in_array($path, ['/media', '/media-library'], true)) {
            return (new MediaController())->index($req);
        }
        if ($method === 'POST' && in_array($path, ['/media', '/media-library'], true)) {
            return (new MediaController())->store($req);
        }
        if ($method === 'POST' && $path === '/media/upload-file') {
            return (new MediaController())->uploadFile($req);
        }
        if (preg_match('#^/media/(\d+)$#', $path, $m) && $method === 'DELETE') {
            return (new MediaController())->destroy($req, (int) $m[1]);
        }

        return Response::json(['error' => 'not found'], 404);
    }
}

