<?php
namespace App\Http;

final class Response
{
    public readonly int $status;
    public readonly array $body;

    private function __construct(int $status, array $body)
    {
        $this->status = $status;
        $this->body = $body;
    }

    public static function json(array $data, int $status = 200): self
    {
        return new self($status, $data);
    }

    public function send(): void
    {
        http_response_code($this->status);
        header('Content-Type: application/json');
        echo json_encode($this->body);
    }
}

