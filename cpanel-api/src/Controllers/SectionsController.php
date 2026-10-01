<?php
namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Middleware\RequireApiKey;
use App\Middleware\RequireSession;
use App\Repositories\ContentSectionRepository;

final class SectionsController
{
    private ContentSectionRepository $repo;

    public function __construct()
    {
        $this->repo = new ContentSectionRepository();
    }

    public function index(Request $req): Response
    {
        if (!RequireApiKey::check($req)) {
            return Response::json(['error' => 'invalid api key'], 401);
        }
        return Response::json($this->repo->all());
    }

    public function show(Request $req, string $key): Response
    {
        if (!RequireApiKey::check($req)) {
            return Response::json(['error' => 'invalid api key'], 401);
        }
        $fields = $this->repo->get($key);
        if ($fields === null) {
            return Response::json(['error' => 'not found'], 404);
        }
        return Response::json($fields);
    }

    public function update(Request $req, string $key): Response
    {
        if (!RequireApiKey::check($req)) {
            return Response::json(['error' => 'invalid api key'], 401);
        }
        if (RequireSession::adminId($req) === null) {
            return Response::json(['error' => 'not authenticated'], 401);
        }
        $this->repo->upsert($key, $req->body);
        return Response::json(['ok' => true]);
    }
}
