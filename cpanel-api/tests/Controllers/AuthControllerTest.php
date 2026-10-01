<?php
namespace Tests\Controllers;

use App\Controllers\AuthController;
use App\Db;
use App\Http\Request;
use PHPUnit\Framework\TestCase;

class AuthControllerTest extends TestCase
{
    private const ADMIN_EMAIL = 'it-support@novasstrading.com';

    protected function setUp(): void
    {
        Db::connection()->exec('DELETE FROM admins');
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash) VALUES ('" . self::ADMIN_EMAIL . "', '" .
            password_hash('secret123', PASSWORD_DEFAULT) . "')"
        );
    }

    private function req(string $path, array $body): Request
    {
        return Request::fromArray([
            'method' => 'POST', 'path' => $path, 'query' => [],
            'headers' => ['X-Api-Key' => getenv('API_KEY')], 'rawBody' => json_encode($body),
        ]);
    }

    private function loginReq(array $body): Request
    {
        return $this->req('/auth/login', $body);
    }

    private function adminRow(): ?array
    {
        $stmt = Db::connection()->prepare('SELECT * FROM admins WHERE email = ?');
        $stmt->execute([self::ADMIN_EMAIL]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * An AuthController wired with a fake mailer that captures what would have
     * been sent instead of calling Brevo. $captured->email / $captured->code are
     * populated (as strings) the moment requestOtp() would have sent an email,
     * and stay null if it never does.
     */
    private function controllerCapturingOtpEmail(\stdClass $captured): AuthController
    {
        $captured->email = null;
        $captured->code = null;
        return new AuthController(function (string $email, string $code) use ($captured) {
            $captured->email = $email;
            $captured->code = $code;
        });
    }

    public function test_login_returns_token_for_correct_credentials(): void
    {
        $controller = new AuthController();
        $res = $controller->login($this->loginReq(['email' => self::ADMIN_EMAIL, 'password' => 'secret123']));
        $this->assertSame(200, $res->status);
        $this->assertArrayHasKey('token', $res->body);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $controller = new AuthController();
        $res = $controller->login($this->loginReq(['email' => self::ADMIN_EMAIL, 'password' => 'wrong']));
        $this->assertSame(401, $res->status);
    }

    public function test_login_rejects_unknown_email(): void
    {
        $controller = new AuthController();
        $res = $controller->login($this->loginReq(['email' => 'nobody@example.com', 'password' => 'secret123']));
        $this->assertSame(401, $res->status);
    }

    public function test_login_rejects_non_admin_email_before_db_lookup(): void
    {
        // Even a correct password for a *different* row (there should only ever be one)
        // must be rejected by the email guard before AdminRepository is ever consulted.
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash) VALUES ('someoneelse@example.com', '" .
            password_hash('secret123', PASSWORD_DEFAULT) . "')"
        );
        $controller = new AuthController();
        $res = $controller->login($this->loginReq(['email' => 'SomeoneElse@example.com', 'password' => 'secret123']));
        $this->assertSame(401, $res->status);
        $this->assertSame(['error' => 'invalid credentials'], $res->body);
    }

    public function test_request_otp_for_admin_email_never_returns_code_but_sends_it_via_mailer(): void
    {
        $captured = new \stdClass();
        $controller = $this->controllerCapturingOtpEmail($captured);
        $res = $controller->requestOtp($this->req('/auth/otp/request', ['email' => self::ADMIN_EMAIL]));

        $this->assertSame(200, $res->status);
        $this->assertSame(['ok' => true], $res->body);
        $this->assertArrayNotHasKey('code', $res->body);

        $this->assertSame(self::ADMIN_EMAIL, $captured->email);
        $this->assertNotNull($captured->code);
        $this->assertSame(6, strlen($captured->code));
        $this->assertTrue(ctype_digit($captured->code));

        $row = $this->adminRow();
        $this->assertNotNull($row['otp_code_hash']);
        $this->assertNotNull($row['otp_expires_at']);
        $this->assertNotNull($row['otp_last_sent_at']);
    }

    public function test_request_otp_case_insensitive_email_matches(): void
    {
        $captured = new \stdClass();
        $controller = $this->controllerCapturingOtpEmail($captured);
        $res = $controller->requestOtp($this->req('/auth/otp/request', ['email' => 'IT-Support@NovaSSTrading.com']));

        $this->assertSame(200, $res->status);
        $this->assertSame(self::ADMIN_EMAIL, $captured->email);
        $this->assertNotNull($captured->code);
    }

    public function test_request_otp_for_non_admin_email_returns_ok_with_no_code_no_mailer_call_and_no_db_change(): void
    {
        $before = $this->adminRow();

        $captured = new \stdClass();
        $controller = $this->controllerCapturingOtpEmail($captured);
        $res = $controller->requestOtp($this->req('/auth/otp/request', ['email' => 'attacker@example.com']));

        $this->assertSame(200, $res->status);
        $this->assertSame(['ok' => true], $res->body);
        $this->assertArrayNotHasKey('code', $res->body);
        $this->assertNull($captured->code, 'mailer must not be invoked for a non-admin email');

        $after = $this->adminRow();
        $this->assertSame($before, $after);
    }

    public function test_request_otp_requires_api_key(): void
    {
        $req = Request::fromArray([
            'method' => 'POST', 'path' => '/auth/otp/request', 'query' => [],
            'headers' => [], 'rawBody' => json_encode(['email' => self::ADMIN_EMAIL]),
        ]);
        $controller = new AuthController();
        $res = $controller->requestOtp($req);
        $this->assertSame(401, $res->status);
    }

    public function test_request_otp_second_call_within_60_seconds_is_rate_limited(): void
    {
        $captured = new \stdClass();
        $controller = $this->controllerCapturingOtpEmail($captured);
        $first = $controller->requestOtp($this->req('/auth/otp/request', ['email' => self::ADMIN_EMAIL]));
        $this->assertSame(200, $first->status);

        $second = $controller->requestOtp($this->req('/auth/otp/request', ['email' => self::ADMIN_EMAIL]));
        $this->assertSame(429, $second->status);
        $this->assertSame(['error' => 'too many requests'], $second->body);
    }

    public function test_verify_otp_with_correct_code_returns_token(): void
    {
        $captured = new \stdClass();
        $controller = $this->controllerCapturingOtpEmail($captured);
        $requestRes = $controller->requestOtp($this->req('/auth/otp/request', ['email' => self::ADMIN_EMAIL]));
        $this->assertSame(200, $requestRes->status);
        $code = $captured->code;

        $res = $controller->verifyOtp($this->req('/auth/otp/verify', ['email' => self::ADMIN_EMAIL, 'code' => $code]));
        $this->assertSame(200, $res->status);
        $this->assertArrayHasKey('token', $res->body);
    }

    public function test_verify_otp_is_single_use(): void
    {
        $captured = new \stdClass();
        $controller = $this->controllerCapturingOtpEmail($captured);
        $controller->requestOtp($this->req('/auth/otp/request', ['email' => self::ADMIN_EMAIL]));
        $code = $captured->code;

        $first = $controller->verifyOtp($this->req('/auth/otp/verify', ['email' => self::ADMIN_EMAIL, 'code' => $code]));
        $this->assertSame(200, $first->status);

        $second = $controller->verifyOtp($this->req('/auth/otp/verify', ['email' => self::ADMIN_EMAIL, 'code' => $code]));
        $this->assertSame(401, $second->status);
        $this->assertSame(['error' => 'invalid or expired code'], $second->body);
    }

    public function test_verify_otp_locks_out_after_5_wrong_attempts(): void
    {
        $captured = new \stdClass();
        $controller = $this->controllerCapturingOtpEmail($captured);
        $controller->requestOtp($this->req('/auth/otp/request', ['email' => self::ADMIN_EMAIL]));
        $code = $captured->code;
        $wrongCode = $code === '000000' ? '111111' : '000000';

        for ($i = 0; $i < 5; $i++) {
            $res = $controller->verifyOtp($this->req('/auth/otp/verify', ['email' => self::ADMIN_EMAIL, 'code' => $wrongCode]));
            $this->assertSame(401, $res->status);
        }

        // 6th attempt, this time with the CORRECT code, must still fail (locked out).
        $res = $controller->verifyOtp($this->req('/auth/otp/verify', ['email' => self::ADMIN_EMAIL, 'code' => $code]));
        $this->assertSame(401, $res->status);
        $this->assertSame(['error' => 'invalid or expired code'], $res->body);
    }

    public function test_verify_otp_fails_after_expiry_window(): void
    {
        $captured = new \stdClass();
        $controller = $this->controllerCapturingOtpEmail($captured);
        $controller->requestOtp($this->req('/auth/otp/request', ['email' => self::ADMIN_EMAIL]));
        $code = $captured->code;

        // Force the stored expiry into the past (in the app's own clock domain,
        // matching how the controller wrote and will compare it) to simulate the
        // 10-minute window elapsing.
        $pastExpiry = (new \DateTimeImmutable('-1 minute'))->format('Y-m-d H:i:s');
        $stmt = Db::connection()->prepare('UPDATE admins SET otp_expires_at = ? WHERE email = ?');
        $stmt->execute([$pastExpiry, self::ADMIN_EMAIL]);

        $res = $controller->verifyOtp($this->req('/auth/otp/verify', ['email' => self::ADMIN_EMAIL, 'code' => $code]));
        $this->assertSame(401, $res->status);
        $this->assertSame(['error' => 'invalid or expired code'], $res->body);
    }

    public function test_verify_otp_requires_api_key(): void
    {
        $req = Request::fromArray([
            'method' => 'POST', 'path' => '/auth/otp/verify', 'query' => [],
            'headers' => [], 'rawBody' => json_encode(['email' => self::ADMIN_EMAIL, 'code' => '123456']),
        ]);
        $controller = new AuthController();
        $res = $controller->verifyOtp($req);
        $this->assertSame(401, $res->status);
    }

    public function test_verify_otp_for_admin_with_no_otp_requested_fails(): void
    {
        $controller = new AuthController();
        $res = $controller->verifyOtp($this->req('/auth/otp/verify', ['email' => self::ADMIN_EMAIL, 'code' => '123456']));
        $this->assertSame(401, $res->status);
        $this->assertSame(['error' => 'invalid or expired code'], $res->body);
    }

    public function test_verify_otp_for_unknown_email_fails(): void
    {
        $controller = new AuthController();
        $res = $controller->verifyOtp($this->req('/auth/otp/verify', ['email' => 'nobody@example.com', 'code' => '123456']));
        $this->assertSame(401, $res->status);
        $this->assertSame(['error' => 'invalid or expired code'], $res->body);
    }
}

