<?php
namespace App\Controllers;

use App\Http\Request;
use App\ImageOptimizer;
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
        $row = $this->repo->find($id);
        if ($row === null) {
            return Response::json(['error' => 'not found'], 404);
        }
        // Deleting a file that content still points at would leave broken images
        // on the live site (and in restorable trash items).
        if ($this->repo->isReferenced($row['path'])) {
            return Response::json(['error' => 'media is in use'], 409);
        }
        $this->repo->delete($id);
        $this->removeFile($row['path']);
        return Response::json(['ok' => true]);
    }

    /** Deletes the stored file for a "media/<name>" path. Strictly confined to the media folder. */
    private function removeFile(string $path): void
    {
        if (!str_starts_with($path, 'media/')) {
            return;
        }
        $name = basename($path);
        if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $name)) {
            return;
        }
        $full = $this->mediaDir . '/' . $name;
        if (is_file($full)) {
            @unlink($full);
        }
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

        if (substr($req->uploadedFileBytes, 0, 5) === '%PDF-') {
            // Documents are stored untouched.
            $stored = [
                'bytes' => $req->uploadedFileBytes,
                'ext' => 'pdf',
                'mime' => 'application/pdf',
                'width' => 0,
                'height' => 0,
                'optimized' => false,
            ];
        } else {
            try {
                $stored = ImageOptimizer::optimize($req->uploadedFileBytes);
            } catch (\InvalidArgumentException $e) {
                return Response::json(['error' => $e->getMessage()], 422);
            }
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $stored['ext'];

        if (!is_dir($this->mediaDir)) {
            mkdir($this->mediaDir, 0775, true);
        }
        file_put_contents($this->mediaDir . '/' . $filename, $stored['bytes']);

        // Report what was actually stored (not what was uploaded) so the caller
        // can record accurate size/dimensions in the media table.
        return Response::json([
            'path' => 'media/' . $filename,
            'bytes' => strlen($stored['bytes']),
            'width' => $stored['width'],
            'height' => $stored['height'],
            'mime_type' => $stored['mime'],
            'optimized' => $stored['optimized'],
        ], 201);
    }
}

