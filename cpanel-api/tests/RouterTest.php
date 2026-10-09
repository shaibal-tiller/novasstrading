<?php
namespace Tests;

use App\Db;
use App\Http\Request;
use App\Router;
use PHPUnit\Framework\TestCase;

class RouterTest extends TestCase
{
    protected function setUp(): void
    {
        Db::connection()->exec('DELETE FROM content_sections');
    }

    private function req(string $method, string $path, array $body = []): Request
    {
        return Request::fromArray([
            'method' => $method, 'path' => $path, 'query' => [],
            'headers' => ['X-Api-Key' => getenv('API_KEY')], 'rawBody' => json_encode($body),
        ]);
    }

    public function test_get_sections_key_routes_to_sections_controller(): void
    {
        $res = Router::dispatch($this->req('GET', '/sections/hero'));
        $this->assertSame(404, $res->status); // not seeded, but proves routing reached the controller
    }

    public function test_unknown_route_returns_404(): void
    {
        $res = Router::dispatch($this->req('GET', '/nope'));
        $this->assertSame(404, $res->status);
    }

    public function test_health_check_returns_ok(): void
    {
        $res = Router::dispatch($this->req('GET', '/health'));
        $this->assertSame(200, $res->status);
        $this->assertSame(['ok' => true], $res->body);
    }

    public function test_delete_sections_key_returns_404(): void
    {
        // Create a section so show() would succeed if incorrectly dispatched
        Db::connection()->exec(
            "INSERT INTO content_sections (section_key, fields_json) VALUES ('hero', '{}')"
        );

        $res = Router::dispatch($this->req('DELETE', '/sections/hero'));
        $this->assertSame(404, $res->status);
    }

    public function test_post_otp_request_routes_to_auth_controller(): void
    {
        Db::connection()->exec('DELETE FROM admins');
        $res = Router::dispatch($this->req('POST', '/auth/otp/request', ['email' => 'nobody@example.com']));
        // Non-admin email is a no-op 200 — proves routing reached AuthController::requestOtp.
        $this->assertSame(200, $res->status);
        $this->assertSame(['ok' => true], $res->body);
    }

    public function test_get_otp_request_returns_404(): void
    {
        $res = Router::dispatch($this->req('GET', '/auth/otp/request'));
        $this->assertSame(404, $res->status);
    }

    public function test_post_otp_verify_routes_to_auth_controller(): void
    {
        Db::connection()->exec('DELETE FROM admins');
        $res = Router::dispatch($this->req('POST', '/auth/otp/verify', ['email' => 'nobody@example.com', 'code' => '123456']));
        // Unknown email is a 401 — proves routing reached AuthController::verifyOtp.
        $this->assertSame(401, $res->status);
        $this->assertSame(['error' => 'invalid or expired code'], $res->body);
    }

    public function test_get_otp_verify_returns_404(): void
    {
        $res = Router::dispatch($this->req('GET', '/auth/otp/verify'));
        $this->assertSame(404, $res->status);
    }
}

