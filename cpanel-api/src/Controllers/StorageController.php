<?php
namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Middleware\RequireApiKey;
use App\Middleware\RequireSession;
use App\Storage\MediaCleaner;

/** Disk-usage report and on-demand housekeeping (admin only). */
final class StorageController
{
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

    public function usage(Request $req): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        return Response::json((new MediaCleaner())->usage());
    }

    /** Body: { "dryRun": bool (default true), "trashDays": int, "minAgeHours": int } */
    public function cleanup(Request $req): Response
    {
        if ($err = $this->authorized($req)) {
            return $err;
        }
        $dryRun = ($req->body['dryRun'] ?? true) !== false;
        $trashDays = max(1, (int) ($req->body['trashDays'] ?? 30));
        $minAgeHours = max(0, (int) ($req->body['minAgeHours'] ?? 72));
        return Response::json((new MediaCleaner())->cleanup($trashDays, $minAgeHours, $dryRun));
    }
}
