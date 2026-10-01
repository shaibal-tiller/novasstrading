<?php
namespace App\Controllers;

use App\Auth;
use App\Http\Request;
use App\Http\Response;
use App\Middleware\RequireApiKey;
use App\Repositories\AdminRepository;

final class AuthController
{
    private const ADMIN_EMAIL = 'it-support@novasstrading.com';
    private const OTP_RESEND_INTERVAL_SECONDS = 60;
    private const OTP_TTL_MINUTES = 10;
    private const OTP_MAX_ATTEMPTS = 5;
    private const OTP_FROM_NAME = 'Nova SS Trading';
    private const OTP_FROM_EMAIL = 'noreply@novasstrading.com';

    private AdminRepository $repo;
    private \Closure $sendOtpEmail;

    /**
     * @param callable|null $sendOtpEmail `function(string $email, string $code): void`.
     *  Defaults to a real Brevo API call. Tests inject a callable that captures the
     *  code instead, so the OTP value never has to appear in an HTTP response and
     *  tests never make a real network call or reverse a bcrypt hash to see it.
     */
    public function __construct(?callable $sendOtpEmail = null)
    {
        $this->repo = new AdminRepository();
        $this->sendOtpEmail = \Closure::fromCallable($sendOtpEmail ?? [$this, 'sendOtpEmailViaBrevo']);
    }

    private function normalizeEmail(Request $req): string
    {
        return strtolower(trim($req->body['email'] ?? ''));
    }

    public function login(Request $req): Response
    {
        if (!RequireApiKey::check($req)) {
            return Response::json(['error' => 'invalid api key'], 401);
        }
        $email = $this->normalizeEmail($req);
        if ($email !== self::ADMIN_EMAIL) {
            return Response::json(['error' => 'invalid credentials'], 401);
        }
        $admin = $this->repo->findByEmail($email);
        if (!$admin || !Auth::verifyPassword($req->body['password'] ?? '', $admin['password_hash'])) {
            return Response::json(['error' => 'invalid credentials'], 401);
        }
        return Response::json(['token' => Auth::issueToken((int) $admin['id'])]);
    }

    public function requestOtp(Request $req): Response
    {
        if (!RequireApiKey::check($req)) {
            return Response::json(['error' => 'invalid api key'], 401);
        }
        $email = $this->normalizeEmail($req);
        // Never reveal whether an email is a valid admin account, and never
        // return the OTP code in the HTTP response: holding the shared API_KEY
        // must NOT be enough on its own to mint a session — the code has to
        // reach the real inbox (via sendOtpEmail) as an independent factor.
        if ($email !== self::ADMIN_EMAIL) {
            return Response::json(['ok' => true]);
        }

        if ($this->repo->isOtpRateLimited($email, self::OTP_RESEND_INTERVAL_SECONDS)) {
            return Response::json(['error' => 'too many requests'], 429);
        }

        $code = Auth::generateOtp();
        $hash = Auth::hashOtp($code);
        // otp_expires_at is written and later compared using PHP's own clock
        // (unlike otp_last_sent_at, which is DB-clock via NOW() in setOtp) —
        // don't mix this with a DB NOW()-based comparison.
        $expiresAt = (new \DateTimeImmutable())->modify('+' . self::OTP_TTL_MINUTES . ' minutes');
        $this->repo->setOtp($email, $hash, $expiresAt);

        ($this->sendOtpEmail)($email, $code);

        return Response::json(['ok' => true]);
    }

    public function verifyOtp(Request $req): Response
    {
        if (!RequireApiKey::check($req)) {
            return Response::json(['error' => 'invalid api key'], 401);
        }
        $email = $this->normalizeEmail($req);
        $code = (string) ($req->body['code'] ?? '');

        $admin = $this->repo->findByEmail($email);
        $invalid = !$admin
            || empty($admin['otp_code_hash'])
            || empty($admin['otp_expires_at'])
            || (new \DateTimeImmutable($admin['otp_expires_at'])) < new \DateTimeImmutable()
            || (int) ($admin['otp_attempts'] ?? 0) >= self::OTP_MAX_ATTEMPTS;

        if ($invalid) {
            return Response::json(['error' => 'invalid or expired code'], 401);
        }

        if (!Auth::verifyOtp($code, $admin['otp_code_hash'])) {
            $this->repo->incrementOtpAttempts($email);
            return Response::json(['error' => 'invalid or expired code'], 401);
        }

        $this->repo->clearOtp($email);
        return Response::json(['token' => Auth::issueToken((int) $admin['id'])]);
    }

    /**
     * Real delivery path: sends the OTP code to the admin's inbox via Brevo's
     * transactional email HTTP API. Never throws — a delivery failure is logged
     * server-side but does not change the HTTP response (same "don't reveal
     * anything" posture as the rest of this endpoint); the account owner should
     * watch server logs, not get delivery-failure signal in the API response.
     */
    private function sendOtpEmailViaBrevo(string $email, string $code): void
    {
        try {
            $apiKey = getenv('BREVO_API_KEY');
            if (!$apiKey) {
                error_log('[AuthController] BREVO_API_KEY not set — OTP email not sent');
                return;
            }

            $payload = json_encode([
                'sender' => ['name' => self::OTP_FROM_NAME, 'email' => self::OTP_FROM_EMAIL],
                'to' => [['email' => $email]],
                'subject' => 'Your Nova SS Trading admin login code',
                'htmlContent' => '<p>Your one-time login code is: <strong>' . htmlspecialchars($code) . '</strong></p>'
                    . '<p>This code expires in ' . self::OTP_TTL_MINUTES . ' minutes. If you did not request this, ignore this email.</p>',
            ]);

            $ch = curl_init('https://api.brevo.com/v3/smtp/email');
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_HTTPHEADER => [
                    'accept: application/json',
                    'api-key: ' . $apiKey,
                    'content-type: application/json',
                ],
                CURLOPT_POSTFIELDS => $payload,
            ]);
            $response = curl_exec($ch);
            $errno = curl_errno($ch);
            $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($errno !== 0 || $status < 200 || $status >= 300) {
                error_log(sprintf(
                    '[AuthController] Brevo OTP email delivery failed (curl errno=%d, http status=%d): %s',
                    $errno,
                    $status,
                    is_string($response) ? $response : ''
                ));
            }
        } catch (\Throwable $e) {
            error_log('[AuthController] Failed to send OTP email: ' . $e->getMessage());
        }
    }
}

