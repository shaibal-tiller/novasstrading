<?php
namespace App;

final class Auth
{
    public static function verifyPassword(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }

    public static function generateOtp(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    public static function hashOtp(string $code): string
    {
        return password_hash($code, PASSWORD_DEFAULT);
    }

    public static function verifyOtp(string $code, string $hash): bool
    {
        return password_verify($code, $hash);
    }

    private static function secret(): string
    {
        $secret = getenv('SESSION_SECRET');
        if (!$secret) {
            throw new \RuntimeException('SESSION_SECRET is not set');
        }
        return $secret;
    }

    public static function issueToken(int $adminId, ?int $expiresAt = null): string
    {
        $expiresAt ??= time() + 60 * 60 * 24 * 30; // 30 days
        $payload = $adminId . '.' . $expiresAt;
        $signature = hash_hmac('sha256', $payload, self::secret());
        return $payload . '.' . $signature;
    }

    public static function verifyToken(string $token): ?int
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$adminId, $expiresAt, $signature] = $parts;
        $payload = $adminId . '.' . $expiresAt;
        $expected = hash_hmac('sha256', $payload, self::secret());

        if (!hash_equals($expected, $signature)) {
            return null;
        }
        if ((int) $expiresAt < time()) {
            return null;
        }
        return (int) $adminId;
    }
}

