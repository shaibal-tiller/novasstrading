<?php
namespace App;

use App\Controllers\AuthController;
use App\Controllers\ItemsController;
use App\Controllers\MediaController;
use App\Controllers\SectionsController;
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

        if ($method === 'POST' && $path === '/auth/login') {
            return (new AuthController())->login($req);
        }
        if ($method === 'POST' && $path === '/auth/otp/request') {
            return (new AuthController())->requestOtp($req);
        }
        if ($method === 'POST' && $path === '/auth/otp/verify') {
            return (new AuthController())->verifyOtp($req);
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

        if ($method === 'GET' && $path === '/media') {
            return (new MediaController())->index($req);
        }
        if ($method === 'POST' && $path === '/media') {
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

