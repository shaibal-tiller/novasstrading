<?php
namespace Tests\Controllers;

use App\Auth;
use App\Controllers\MediaController;
use App\Db;
use App\Http\Request;
use PHPUnit\Framework\TestCase;

class MediaControllerTest extends TestCase
{
    private string $apiKey;
    private string $token;

    protected function setUp(): void
    {
        Db::connection()->exec('DELETE FROM media');
        Db::connection()->exec('DELETE FROM admins');
        Db::connection()->exec("INSERT INTO admins (id, email, password_hash) VALUES (1, 'a@example.com', 'x')");
        $this->apiKey = getenv('API_KEY');
        $this->token = Auth::issueToken(1);
    }

    private function req(string $method, string $path, array $body = []): Request
    {
        return Request::fromArray([
            'method' => $method, 'path' => $path, 'query' => [],
            'headers' => ['X-Api-Key' => $this->apiKey, 'Authorization' => "Bearer {$this->token}"],
            'rawBody' => json_encode($body),
        ]);
    }

    public function test_store_rejects_files_over_5mb(): void
    {
        $controller = new MediaController();
        $res = $controller->store($this->req('POST', '/media', [
            'path' => 'media/big.webp', 'original_filename' => 'big.jpg',
            'bytes' => 6 * 1024 * 1024, 'width' => 100, 'height' => 100, 'mime_type' => 'image/webp',
        ]));
        $this->assertSame(422, $res->status);
    }

    public function test_store_then_index_round_trips(): void
    {
        $controller = new MediaController();
        $store = $controller->store($this->req('POST', '/media', [
            'path' => 'media/ok.webp', 'original_filename' => 'ok.jpg',
            'bytes' => 100000, 'width' => 800, 'height' => 600, 'mime_type' => 'image/webp',
        ]));
        $this->assertSame(201, $store->status);

        $index = $controller->index($this->req('GET', '/media'));
        $this->assertCount(1, $index->body);
    }

    public function test_destroy_removes_the_media_row(): void
    {
        $controller = new MediaController();
        $store = $controller->store($this->req('POST', '/media', [
            'path' => 'media/ok.webp', 'original_filename' => 'ok.jpg',
            'bytes' => 100000, 'width' => 800, 'height' => 600, 'mime_type' => 'image/webp',
        ]));
        $id = $store->body['id'];
        $del = $controller->destroy($this->req('DELETE', "/media/{$id}"), $id);
        $this->assertSame(200, $del->status);
        $this->assertCount(0, $controller->index($this->req('GET', '/media'))->body);
    }

    private function uploadReq(string $bytes, string $filename, bool $withApiKey = true, bool $withSession = true): Request
    {
        $headers = [];
        if ($withApiKey) {
            $headers['X-Api-Key'] = $this->apiKey;
        }
        if ($withSession) {
            $headers['Authorization'] = "Bearer {$this->token}";
        }
        return Request::fromArray([
            'method' => 'POST', 'path' => '/media/upload-file', 'query' => [],
            'headers' => $headers, 'rawBody' => '',
            'uploadedFileBytes' => $bytes, 'uploadedFileName' => $filename,
        ]);
    }

    private function realWebpBytes(): string
    {
        $image = imagecreatetruecolor(4, 4);
        ob_start();
        imagewebp($image);
        return ob_get_clean();
    }

    private function minimalPdfBytes(): string
    {
        return "%PDF-1.4\n%minimal PDF\n";
    }

    public function test_upload_file_writes_bytes_to_the_media_dir(): void
    {
        $tempDir = sys_get_temp_dir() . '/media-test-' . uniqid();
        mkdir($tempDir, 0775, true);

        try {
            $controller = new MediaController($tempDir);
            $bytes = $this->realWebpBytes();

            $res = $controller->uploadFile($this->uploadReq($bytes, '1700000000-photo.webp'));

            $this->assertSame(201, $res->status);
            $this->assertMatchesRegularExpression('#^media/[0-9a-f]{32}\.webp$#', $res->body['path']);

            $writtenPath = $tempDir . '/' . basename($res->body['path']);
            $this->assertFileExists($writtenPath);
            $this->assertSame($bytes, file_get_contents($writtenPath));
        } finally {
            @unlink($tempDir . '/' . basename($res->body['path'] ?? ''));
            @rmdir($tempDir);
        }
    }

    public function test_upload_file_rejects_non_image_bytes(): void
    {
        $tempDir = sys_get_temp_dir() . '/media-test-' . uniqid();
        mkdir($tempDir, 0775, true);

        try {
            $controller = new MediaController($tempDir);
            $res = $controller->uploadFile($this->uploadReq('not an image', 'x.webp'));

            $this->assertSame(422, $res->status);
            $this->assertSame(['error' => 'invalid image data'], $res->body);
            $this->assertSame([], glob($tempDir . '/*'));
        } finally {
            @rmdir($tempDir);
        }
    }

    public function test_upload_file_rejects_missing_api_key(): void
    {
        $controller = new MediaController(sys_get_temp_dir());
        $res = $controller->uploadFile($this->uploadReq('bytes', 'x.webp', withApiKey: false));
        $this->assertSame(401, $res->status);
    }

    public function test_upload_file_rejects_missing_session(): void
    {
        $controller = new MediaController(sys_get_temp_dir());
        $res = $controller->uploadFile($this->uploadReq('bytes', 'x.webp', withSession: false));
        $this->assertSame(401, $res->status);
    }

    public function test_upload_file_rejects_when_no_file_present(): void
    {
        $controller = new MediaController(sys_get_temp_dir());
        $req = Request::fromArray([
            'method' => 'POST', 'path' => '/media/upload-file', 'query' => [],
            'headers' => ['X-Api-Key' => $this->apiKey, 'Authorization' => "Bearer {$this->token}"],
            'rawBody' => '',
        ]);
        $res = $controller->uploadFile($req);
        $this->assertSame(422, $res->status);
    }

    public function test_upload_file_accepts_pdf_with_magic_bytes(): void
    {
        $tempDir = sys_get_temp_dir() . '/media-test-' . uniqid();
        mkdir($tempDir, 0775, true);

        try {
            $controller = new MediaController($tempDir);
            $bytes = $this->minimalPdfBytes();

            $res = $controller->uploadFile($this->uploadReq($bytes, 'test.pdf'));

            $this->assertSame(201, $res->status);
            $this->assertMatchesRegularExpression('#^media/[0-9a-f]{32}\.pdf$#', $res->body['path']);

            $writtenPath = $tempDir . '/' . basename($res->body['path']);
            $this->assertFileExists($writtenPath);
            $this->assertSame($bytes, file_get_contents($writtenPath));
        } finally {
            @unlink($tempDir . '/' . basename($res->body['path'] ?? ''));
            @rmdir($tempDir);
        }
    }

    public function test_upload_file_rejects_bytes_that_are_neither_image_nor_pdf(): void
    {
        $tempDir = sys_get_temp_dir() . '/media-test-' . uniqid();
        mkdir($tempDir, 0775, true);

        try {
            $controller = new MediaController($tempDir);
            $res = $controller->uploadFile($this->uploadReq('neither image nor pdf', 'x.bin'));

            $this->assertSame(422, $res->status);
            $this->assertSame(['error' => 'invalid image data'], $res->body);
            $this->assertSame([], glob($tempDir . '/*'));
        } finally {
            @rmdir($tempDir);
        }
    }

    public function test_upload_file_rejects_pdf_over_5mb(): void
    {
        $tempDir = sys_get_temp_dir() . '/media-test-' . uniqid();
        mkdir($tempDir, 0775, true);

        try {
            $controller = new MediaController($tempDir);
            $bytes = "%PDF-1.4\n" . str_repeat('x', 6 * 1024 * 1024);

            $res = $controller->uploadFile($this->uploadReq($bytes, 'large.pdf'));

            $this->assertSame(422, $res->status);
            $this->assertSame(['error' => 'file exceeds 5MB limit'], $res->body);
            $this->assertSame([], glob($tempDir . '/*'));
        } finally {
            @rmdir($tempDir);
        }
    }
}

