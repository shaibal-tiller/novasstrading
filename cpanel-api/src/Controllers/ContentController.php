<?php
namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Middleware\RequireApiKey;
use App\Repositories\ContentItemRepository;
use App\Repositories\ContentSectionRepository;

/**
 * GET /content — the whole public site's content in one response:
 *   { "sections": { key: fields }, "items": { sectionKey: [{id, fields}] } }
 *
 * The Next.js site used to make one request for sections plus one per list
 * (~20 sequential round trips to cPanel on every cache miss). One bulk read
 * is two SQL queries and a single HTTP round trip.
 */
final class ContentController
{
    public function index(Request $req): Response
    {
        if (!RequireApiKey::check($req)) {
            return Response::json(['error' => 'invalid api key'], 401);
        }
        return Response::json([
            'sections' => (new ContentSectionRepository())->all(),
            'items' => (new ContentItemRepository())->listAllGrouped(),
        ]);
    }
}
