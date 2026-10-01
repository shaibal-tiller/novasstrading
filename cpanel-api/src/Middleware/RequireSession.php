<?php
namespace App\Middleware;

use App\Auth;
use App\Http\Request;

final class RequireSession
{
    public static function adminId(Request $req): ?int
    {
        $header = $req->headers['Authorization'] ?? '';
        if (!str_starts_with($header, 'Bearer ')) {
            return null;
        }
        return Auth::verifyToken(substr($header, 7));
    }
}
