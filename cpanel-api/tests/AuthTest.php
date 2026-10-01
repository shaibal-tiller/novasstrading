<?php
namespace Tests;

use App\Auth;
use PHPUnit\Framework\TestCase;

class AuthTest extends TestCase
{
    public function test_verify_password_true_for_matching_hash(): void
    {
        $hash = password_hash('correct-horse', PASSWORD_DEFAULT);
        $this->assertTrue(Auth::verifyPassword('correct-horse', $hash));
    }

    public function test_verify_password_false_for_wrong_password(): void
    {
        $hash = password_hash('correct-horse', PASSWORD_DEFAULT);
        $this->assertFalse(Auth::verifyPassword('wrong', $hash));
    }

    public function test_issue_and_verify_token_round_trip(): void
    {
        $token = Auth::issueToken(42);
        $this->assertSame(42, Auth::verifyToken($token));
    }

    public function test_verify_token_rejects_tampered_token(): void
    {
        $token = Auth::issueToken(42);
        $tampered = substr($token, 0, -1) . 'x';
        $this->assertNull(Auth::verifyToken($tampered));
    }

    public function test_verify_token_rejects_expired_token(): void
    {
        $token = Auth::issueToken(42, expiresAt: time() - 10);
        $this->assertNull(Auth::verifyToken($token));
    }

    public function test_issue_token_throws_when_session_secret_not_set(): void
    {
        $original = getenv('SESSION_SECRET');
        try {
            putenv('SESSION_SECRET');
            $this->expectException(\RuntimeException::class);
            Auth::issueToken(42);
        } finally {
            putenv($original === false ? 'SESSION_SECRET' : 'SESSION_SECRET=' . $original);
        }
    }

    public function test_issue_token_default_expiry_is_30_days(): void
    {
        $before = time() + 60 * 60 * 24 * 30;
        $token = Auth::issueToken(42);
        $after = time() + 60 * 60 * 24 * 30;

        $parts = explode('.', $token);
        $expiresAt = (int) $parts[1];

        $this->assertGreaterThanOrEqual($before, $expiresAt);
        $this->assertLessThanOrEqual($after, $expiresAt);
    }

    public function test_generate_otp_returns_6_digit_string(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $otp = Auth::generateOtp();
            $this->assertSame(6, strlen($otp));
            $this->assertTrue(ctype_digit($otp));
        }
    }

    public function test_generate_otp_includes_leading_zeros(): void
    {
        // Run enough times to hopefully hit a number that would lose leading zero if not padded
        $hasLeadingZero = false;
        for ($i = 0; $i < 10000; $i++) {
            $otp = Auth::generateOtp();
            if ($otp[0] === '0') {
                $hasLeadingZero = true;
                break;
            }
        }
        $this->assertTrue($hasLeadingZero, 'Never generated an OTP with leading zero after 10000 attempts');
    }

    public function test_hash_otp_and_verify_otp_round_trip(): void
    {
        $code = Auth::generateOtp();
        $hash = Auth::hashOtp($code);
        $this->assertTrue(Auth::verifyOtp($code, $hash));
    }

    public function test_verify_otp_fails_for_wrong_code(): void
    {
        $code = Auth::generateOtp();
        $hash = Auth::hashOtp($code);
        $wrongCode = Auth::generateOtp();
        // Keep generating until we get a different code
        while ($wrongCode === $code) {
            $wrongCode = Auth::generateOtp();
        }
        $this->assertFalse(Auth::verifyOtp($wrongCode, $hash));
    }
}

