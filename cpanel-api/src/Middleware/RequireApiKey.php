<?php
namespace App\Middleware;

use App\Http\Request;

final class RequireApiKey
{
    public static function check(Request $req): bool
    {
        $provided = $req->headers['X-Api-Key'] ?? '';
        return $provided !== '' && hash_equals(getenv('API_KEY'), $provided);
    }
}

