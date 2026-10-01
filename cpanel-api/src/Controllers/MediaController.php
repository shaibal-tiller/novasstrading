<?php
namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Middleware\RequireApiKey;
use App\Middleware\RequireSession;
use App\Repositories\MediaRepository;

final class MediaController
{
    private const MAX_BYTES = 5 * 1024 * 1024;

    private MediaRepository $repo;
    private string $mediaDir;

    /**
     * @param string|null $mediaDir Directory uploaded files are written to. Defaults to the
     *  real `public/media` directory served by this API; tests pass a temp directory so they
     *  never touch the real uploads folder.
     */
    public function __construct(?string $mediaDir = null)
    {
        $this->repo = new MediaRepository();
        $this->mediaDir = $mediaDir ?? __DIR__ . '/../../public/media';
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
        return Response::json($this->repo->all());
    }

    public function store(Request $req): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        if ($req->body['bytes'] > self::MAX_BYTES) {
            return Response::json(['error' => 'file exceeds 5MB limit'], 422);
        }
        $id = $this->repo->create($req->body);
        return Response::json(['id' => $id], 201);
    }

    public function destroy(Request $req, int $id): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        $this->repo->delete($id);
        return Response::json(['ok' => true]);
    }

    public function uploadFile(Request $req): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        if ($req->uploadedFileBytes === null || $req->uploadedFileName === null || $req->uploadedFileName === '') {
            return Response::json(['error' => 'missing file'], 422);
        }
        if (strlen($req->uploadedFileBytes) > self::MAX_BYTES) {
            return Response::json(['error' => 'file exceeds 5MB limit'], 422);
        }

        // Check if the uploaded file is a PDF
        if (substr($req->uploadedFileBytes, 0, 5) === '%PDF-') {
            $filename = bin2hex(random_bytes(16)) . '.pdf';
        } else {
            // Existing image validation
            if (getimagesizefromstring($req->uploadedFileBytes) === false) {
                return Response::json(['error' => 'invalid image data'], 422);
            }
            $filename = bin2hex(random_bytes(16)) . '.webp';
        }

        if (!is_dir($this->mediaDir)) {
            mkdir($this->mediaDir, 0775, true);
        }
        $targetPath = $this->mediaDir . '/' . $filename;
        file_put_contents($targetPath, $req->uploadedFileBytes);

        $path = 'media/' . $filename;
        return Response::json(['path' => $path], 201);
    }
}

