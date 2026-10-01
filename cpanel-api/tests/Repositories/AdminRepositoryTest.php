<?php
namespace Tests\Repositories;

use App\Db;
use App\Repositories\AdminRepository;
use PHPUnit\Framework\TestCase;

class AdminRepositoryTest extends TestCase
{
    protected function setUp(): void
    {
        Db::connection()->exec('DELETE FROM admins');
    }

    public function test_find_by_email_returns_null_when_missing(): void
    {
        $repo = new AdminRepository();
        $this->assertNull($repo->findByEmail('missing@example.com'));
    }

    public function test_find_by_email_returns_row_when_present(): void
    {
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash) VALUES ('a@example.com', 'hash123')"
        );
        $repo = new AdminRepository();
        $row = $repo->findByEmail('a@example.com');
        $this->assertSame('a@example.com', $row['email']);
        $this->assertSame('hash123', $row['password_hash']);
    }

    public function test_set_otp_stores_hash_and_expiry(): void
    {
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash) VALUES ('a@example.com', 'hash123')"
        );
        $repo = new AdminRepository();
        $expiresAt = new \DateTimeImmutable('2026-09-10 12:00:00', new \DateTimeZone('UTC'));
        $repo->setOtp('a@example.com', 'otp_hash_123', $expiresAt);

        $row = $repo->findByEmail('a@example.com');
        $this->assertSame('otp_hash_123', $row['otp_code_hash']);
        $this->assertSame('2026-09-10 12:00:00', $row['otp_expires_at']);
        $this->assertSame(0, (int) $row['otp_attempts']);
        $this->assertNotNull($row['otp_last_sent_at']);
    }

    public function test_set_otp_resets_otp_attempts(): void
    {
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash, otp_attempts) VALUES ('a@example.com', 'hash123', 5)"
        );
        $repo = new AdminRepository();
        $expiresAt = new \DateTimeImmutable('2026-09-10 12:00:00', new \DateTimeZone('UTC'));
        $repo->setOtp('a@example.com', 'otp_hash_123', $expiresAt);

        $row = $repo->findByEmail('a@example.com');
        $this->assertSame(0, (int) $row['otp_attempts']);
    }

    public function test_clear_otp_nulls_all_otp_columns(): void
    {
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash, otp_code_hash, otp_expires_at, otp_attempts, otp_last_sent_at) VALUES ('a@example.com', 'hash123', 'hash_123', '2026-09-10 12:00:00', 5, NOW())"
        );
        $repo = new AdminRepository();
        $repo->clearOtp('a@example.com');

        $row = $repo->findByEmail('a@example.com');
        $this->assertNull($row['otp_code_hash']);
        $this->assertNull($row['otp_expires_at']);
        $this->assertSame(0, (int) $row['otp_attempts']);
        $this->assertNull($row['otp_last_sent_at']);
    }

    public function test_increment_otp_attempts_from_zero(): void
    {
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash) VALUES ('a@example.com', 'hash123')"
        );
        $repo = new AdminRepository();
        $repo->incrementOtpAttempts('a@example.com');

        $row = $repo->findByEmail('a@example.com');
        $this->assertSame(1, (int) $row['otp_attempts']);
    }

    public function test_increment_otp_attempts_from_existing_value(): void
    {
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash, otp_attempts) VALUES ('a@example.com', 'hash123', 3)"
        );
        $repo = new AdminRepository();
        $repo->incrementOtpAttempts('a@example.com');

        $row = $repo->findByEmail('a@example.com');
        $this->assertSame(4, (int) $row['otp_attempts']);
    }

    public function test_is_otp_rate_limited_false_when_never_sent(): void
    {
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash) VALUES ('a@example.com', 'hash123')"
        );
        $repo = new AdminRepository();
        $this->assertFalse($repo->isOtpRateLimited('a@example.com', 60));
    }

    public function test_is_otp_rate_limited_true_immediately_after_set_otp(): void
    {
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash) VALUES ('a@example.com', 'hash123')"
        );
        $repo = new AdminRepository();
        $repo->setOtp('a@example.com', 'hash', new \DateTimeImmutable('+10 minutes'));

        $this->assertTrue($repo->isOtpRateLimited('a@example.com', 60));
    }

    public function test_is_otp_rate_limited_false_once_window_has_passed(): void
    {
        Db::connection()->exec(
            "INSERT INTO admins (email, password_hash, otp_last_sent_at) VALUES ('a@example.com', 'hash123', DATE_SUB(NOW(), INTERVAL 61 SECOND))"
        );
        $repo = new AdminRepository();
        $this->assertFalse($repo->isOtpRateLimited('a@example.com', 60));
    }
}

