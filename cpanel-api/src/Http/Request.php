<?php
namespace App\Http;

final class Request
{
    public readonly string $method;
    public readonly string $path;
    public readonly array $query;
    public readonly array $headers;
    public readonly array $body;
    public readonly ?string $uploadedFileBytes;
    public readonly ?string $uploadedFileName;

    private function __construct(
        string $method,
        string $path,
        array $query,
        array $headers,
        array $body,
        ?string $uploadedFileBytes = null,
        ?string $uploadedFileName = null
    ) {
        $this->method = $method;
        $this->path = $path;
        $this->query = $query;
        $this->headers = $headers;
        $this->body = $body;
        $this->uploadedFileBytes = $uploadedFileBytes;
        $this->uploadedFileName = $uploadedFileName;
    }

    public static function fromArray(array $data): self
    {
        $decoded = json_decode($data['rawBody'] ?? '', true);
        return new self(
            $data['method'],
            $data['path'],
            $data['query'] ?? [],
            $data['headers'] ?? [],
            is_array($decoded) ? $decoded : [],
            $data['uploadedFileBytes'] ?? null,
            $data['uploadedFileName'] ?? null
        );
    }

    public static function fromGlobals(): self
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
                $headers[$name] = $value;
            }
        }

        $uploadedFileBytes = null;
        $uploadedFileName = null;
        if (isset($_FILES['file']['tmp_name']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
            $uploadedFileBytes = file_get_contents($_FILES['file']['tmp_name']) ?: '';
            $uploadedFileName = (string) $_FILES['file']['name'];
        }

        return self::fromArray([
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
            'path' => parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/',
            'query' => $_GET,
            'headers' => $headers,
            'rawBody' => file_get_contents('php://input') ?: '',
            'uploadedFileBytes' => $uploadedFileBytes,
            'uploadedFileName' => $uploadedFileName,
        ]);
    }
}

