<?php
namespace App;

/**
 * Server-side image optimization for uploads, so the cPanel host is the single
 * place that decides what ends up in public/media/ — regardless of which client
 * (the Next.js portal, a script, curl) sent the file.
 *
 * What it does to a JPEG/PNG/WebP:
 *  - bakes in the EXIF orientation (phone photos otherwise end up sideways)
 *  - downsizes anything larger than MAX_DIMENSION on its long edge
 *  - re-encodes to WebP at WEBP_QUALITY and drops metadata (GPS, camera, etc.)
 *
 * Encoder: Imagick if it can write WebP, otherwise GD (imagewebp). If neither
 * is available the original bytes are stored untouched under their real
 * extension — an upload never fails just because the host lacks a library.
 *
 * Idempotent on purpose: a WebP that already fits is returned as-is, so a client
 * that pre-optimizes does not get re-compressed (and re-degraded) here.
 */
final class ImageOptimizer
{
    public const MAX_DIMENSION = 1600;
    public const WEBP_QUALITY = 80;
    /** Decoding allocates ~4 bytes/pixel; refuse images that could exhaust shared-host memory. */
    private const MAX_PIXELS = 40_000_000;

    private const EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    /**
     * @return array{bytes:string, ext:string, mime:string, width:int, height:int, optimized:bool}
     * @throws \InvalidArgumentException when the bytes are not a supported image
     */
    public static function optimize(string $bytes): array
    {
        $info = @getimagesizefromstring($bytes);
        if ($info === false || !isset(self::EXTENSIONS[$info['mime']])) {
            throw new \InvalidArgumentException('invalid image data');
        }
        [$width, $height] = $info;
        $mime = $info['mime'];
        if ($width * $height > self::MAX_PIXELS) {
            throw new \InvalidArgumentException('image dimensions too large');
        }

        $original = [
            'bytes' => $bytes,
            'ext' => self::EXTENSIONS[$mime],
            'mime' => $mime,
            'width' => $width,
            'height' => $height,
            'optimized' => false,
        ];

        // Animated GIFs cannot survive a still re-encode.
        if ($mime === 'image/gif') {
            return $original;
        }
        // Already a WebP that fits: nothing to gain, and re-encoding would only lose quality.
        if ($mime === 'image/webp' && max($width, $height) <= self::MAX_DIMENSION) {
            return $original;
        }

        $encoded = self::reencode($bytes, $mime);
        if ($encoded === null) {
            return $original;
        }

        // Re-encoding can enlarge an already small, well-compressed image. Keep the
        // original then — unless it was resized/rotated, which is the point.
        $changedShape = $encoded['width'] !== $width || $encoded['height'] !== $height;
        if (!$changedShape && strlen($encoded['bytes']) >= strlen($bytes)) {
            return $original;
        }

        return $encoded;
    }

    private static function reencode(string $bytes, string $mime): ?array
    {
        if (class_exists(\Imagick::class)) {
            try {
                if (in_array('WEBP', \Imagick::queryFormats('WEBP'), true)) {
                    return self::withImagick($bytes);
                }
            } catch (\Throwable $e) {
                // fall through to GD
            }
        }
        if (function_exists('imagewebp') && function_exists('imagecreatefromstring')) {
            try {
                return self::withGd($bytes, $mime);
            } catch (\Throwable $e) {
                // fall through to "store as-is"
            }
        }
        return null;
    }

    private static function withImagick(string $bytes): array
    {
        $im = new \Imagick();
        $im->readImageBlob($bytes);

        switch ($im->getImageOrientation()) {
            case \Imagick::ORIENTATION_BOTTOMRIGHT:
                $im->rotateImage('#000', 180);
                break;
            case \Imagick::ORIENTATION_RIGHTTOP:
                $im->rotateImage('#000', 90);
                break;
            case \Imagick::ORIENTATION_LEFTBOTTOM:
                $im->rotateImage('#000', -90);
                break;
        }
        $im->setImageOrientation(\Imagick::ORIENTATION_TOPLEFT);

        if (max($im->getImageWidth(), $im->getImageHeight()) > self::MAX_DIMENSION) {
            $im->thumbnailImage(self::MAX_DIMENSION, self::MAX_DIMENSION, true);
        }

        $im->setImageFormat('webp');
        $im->setImageCompressionQuality(self::WEBP_QUALITY);
        $im->stripImage();

        $result = [
            'bytes' => $im->getImageBlob(),
            'ext' => 'webp',
            'mime' => 'image/webp',
            'width' => $im->getImageWidth(),
            'height' => $im->getImageHeight(),
            'optimized' => true,
        ];
        $im->clear();
        return $result;
    }

    private static function withGd(string $bytes, string $mime): array
    {
        $img = imagecreatefromstring($bytes);
        if ($img === false) {
            throw new \RuntimeException('GD could not decode image');
        }
        // imagewebp() rejects palette images; PNG/GIF-style palettes become true colour.
        imagepalettetotruecolor($img);
        imagealphablending($img, false);
        imagesavealpha($img, true);

        // GD ignores EXIF, so apply the orientation by hand (JPEG only, needs ext/exif).
        $orientation = 1;
        if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
            $exif = @exif_read_data('data://image/jpeg;base64,' . base64_encode($bytes));
            $orientation = (int) ($exif['Orientation'] ?? 1);
        }
        // imagerotate() turns counter-clockwise; EXIF 6 means "rotate 90° clockwise to display".
        $angle = match ($orientation) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };
        if ($angle !== 0) {
            $rotated = imagerotate($img, $angle, 0);
            if ($rotated !== false) {
                imagedestroy($img);
                $img = $rotated;
                imagealphablending($img, false);
                imagesavealpha($img, true);
            }
        }

        $width = imagesx($img);
        $height = imagesy($img);
        if (max($width, $height) > self::MAX_DIMENSION) {
            $scale = self::MAX_DIMENSION / max($width, $height);
            $scaled = imagescale(
                $img,
                max(1, (int) round($width * $scale)),
                max(1, (int) round($height * $scale)),
                IMG_BICUBIC
            );
            if ($scaled === false) {
                throw new \RuntimeException('GD could not resize image');
            }
            imagedestroy($img);
            $img = $scaled;
            imagealphablending($img, false);
            imagesavealpha($img, true);
            $width = imagesx($img);
            $height = imagesy($img);
        }

        ob_start();
        $ok = imagewebp($img, null, self::WEBP_QUALITY);
        $out = ob_get_clean();
        imagedestroy($img);
        if (!$ok || $out === false || $out === '') {
            throw new \RuntimeException('GD could not encode WebP');
        }

        return [
            'bytes' => $out,
            'ext' => 'webp',
            'mime' => 'image/webp',
            'width' => $width,
            'height' => $height,
            'optimized' => true,
        ];
    }
}
