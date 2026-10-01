<?php
namespace Tests;

use App\ImageOptimizer;
use PHPUnit\Framework\TestCase;

final class ImageOptimizerTest extends TestCase
{
    private function jpeg(int $w, int $h): string
    {
        $img = imagecreatetruecolor($w, $h);
        ob_start();
        imagejpeg($img, null, 95);
        return ob_get_clean();
    }

    public function test_rejects_non_image_bytes(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        ImageOptimizer::optimize('definitely not an image');
    }

    public function test_oversized_jpeg_is_downsized_to_webp(): void
    {
        if (!function_exists('imagewebp') && !class_exists(\Imagick::class)) {
            $this->markTestSkipped('no WebP encoder (GD imagewebp or Imagick) on this machine');
        }
        $out = ImageOptimizer::optimize($this->jpeg(2400, 1200));

        $this->assertTrue($out['optimized']);
        $this->assertSame('webp', $out['ext']);
        $this->assertSame('image/webp', $out['mime']);
        $this->assertSame(ImageOptimizer::MAX_DIMENSION, max($out['width'], $out['height']));
        $this->assertSame(800, min($out['width'], $out['height']));
        $this->assertSame('image/webp', getimagesizefromstring($out['bytes'])['mime']);
    }

    public function test_webp_that_already_fits_is_left_alone(): void
    {
        if (!function_exists('imagewebp')) {
            $this->markTestSkipped('GD imagewebp not available');
        }
        $img = imagecreatetruecolor(100, 100);
        ob_start();
        imagewebp($img);
        $webp = ob_get_clean();

        $out = ImageOptimizer::optimize($webp);

        $this->assertFalse($out['optimized']);
        $this->assertSame($webp, $out['bytes']);
    }

    public function test_never_fails_when_no_encoder_is_available_keeps_real_extension(): void
    {
        // A small JPEG: whether or not an encoder exists, the result must be a
        // valid image with an extension that matches its real type.
        $out = ImageOptimizer::optimize($this->jpeg(40, 40));

        $this->assertContains($out['ext'], ['jpg', 'webp']);
        $this->assertSame($out['mime'], getimagesizefromstring($out['bytes'])['mime']);
    }
}
