<?php
namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Middleware\RequireApiKey;
use App\Middleware\RequireSession;
use App\Repositories\ContentItemRepository;
use App\Storage\MediaCleaner;

final class ItemsController
{
    private ContentItemRepository $repo;

    public function __construct()
    {
        $this->repo = new ContentItemRepository();
    }

    private function authorized(Request $req): ?Response
    {
        if (!RequireApiKey::check($req)) {
            return Response::json(['error' => 'invalid api key'], 401);
        }
        if (RequireSession::adminId($req) === null) {
            return Response::json(['error' => 'not authenticated'], 401);
        }
        return null;
    }

    public function index(Request $req): Response
    {
        if (!RequireApiKey::check($req)) {
            return Response::json(['error' => 'invalid api key'], 401);
        }
        $section = $req->query['section'] ?? '';
        return Response::json($this->repo->listBySection($section));
    }

    public function create(Request $req): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        $id = $this->repo->create($req->body['section'], $req->body['fields']);
        return Response::json(['id' => $id], 201);
    }

    public function update(Request $req, int $id): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        $this->repo->update($id, $req->body['fields']);
        return Response::json(['ok' => true]);
    }

    public function delete(Request $req, int $id): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        $this->repo->softDelete($id);
        return Response::json(['ok' => true]);
    }

    public function reorder(Request $req): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        $this->repo->reorder($req->body['section'], $req->body['ids']);
        return Response::json(['ok' => true]);
    }

    public function trash(Request $req): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        return Response::json($this->repo->listDeleted());
    }

    public function restore(Request $req, int $id): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        $this->repo->restore($id);
        return Response::json(['ok' => true]);
    }

    /** Permanently deletes one TRASHED item and frees its photos if nothing else uses them. */
    public function purge(Request $req, int $id): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        $result = (new MediaCleaner())->purgeItem($id);
        if (!$result['purged']) {
            return Response::json(['error' => 'not in the trash'], 404);
        }
        return Response::json($result);
    }

    /** Permanently deletes everything in the trash. */
    public function emptyTrash(Request $req): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        return Response::json((new MediaCleaner())->emptyTrash());
    }
}
