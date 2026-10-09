<?php
namespace App\Repositories;

use App\Db;

final class AdminRepository
{
    public function findByEmail(string $email): ?array
    {
        $stmt = Db::connection()->prepare('SELECT * FROM admins WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function setOtp(string $email, string $codeHash, \DateTimeImmutable $expiresAt): void
    {
        $stmt = Db::connection()->prepare(
            'UPDATE admins SET otp_code_hash = ?, otp_expires_at = ?, otp_attempts = 0, otp_last_sent_at = NOW() WHERE email = ?'
        );
        $stmt->execute([$codeHash, $expiresAt->format('Y-m-d H:i:s'), $email]);
    }

    public function clearOtp(string $email): void
    {
        $stmt = Db::connection()->prepare(
            'UPDATE admins SET otp_code_hash = NULL, otp_expires_at = NULL, otp_attempts = 0, otp_last_sent_at = NULL WHERE email = ?'
        );
        $stmt->execute([$email]);
    }

    public function incrementOtpAttempts(string $email): void
    {
        $stmt = Db::connection()->prepare(
            'UPDATE admins SET otp_attempts = otp_attempts + 1 WHERE email = ?'
        );
        $stmt->execute([$email]);
    }

    /**
     * True if an OTP was sent to this email within the last $seconds seconds.
     *
     * otp_last_sent_at is written using the database's own NOW() (see setOtp
     * above), so this check is done entirely inside a single SQL predicate
     * against the database's own clock rather than comparing against PHP's
     * time() — the app server and DB server clocks/timezones are not
     * guaranteed to agree.
     */
    public function isOtpRateLimited(string $email, int $seconds): bool
    {
        $stmt = Db::connection()->prepare(
            'SELECT (otp_last_sent_at IS NOT NULL AND otp_last_sent_at > DATE_SUB(NOW(), INTERVAL ? SECOND)) AS rate_limited '
            . 'FROM admins WHERE email = ?'
        );
        $stmt->execute([$seconds, $email]);
        $row = $stmt->fetch();
        return $row !== false && (int) $row['rate_limited'] === 1;
    }
}

