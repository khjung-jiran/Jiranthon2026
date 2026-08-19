<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Service\SpeechService;
use Eum\Support\Logger;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class VoiceController
{
    public function __construct(
        private readonly SpeechService $speech,
        private readonly Logger $logger,
    ) {
    }

    public function transcribe(Request $req, Response $res): Response
    {
        \set_time_limit(150);
        $input = Input::from($req);
        $filePath = $input->required('file_path');

        $text = $this->speech->transcribeOrFail(
            $filePath,
            (string) $input->optional('engine', 'whisper'),
            (string) $input->optional('language', 'ko'),
        );

        $this->logger->info('STT 완료: ' . \mb_substr($text, 0, 50));

        return ApiResponse::json($res, [
            'text' => $text,
            'audio_file_path' => $filePath,
        ]);
    }

    public function synthesize(Request $req, Response $res): Response
    {
        \set_time_limit(90);
        $input = Input::from($req);

        $url = $this->speech->synthesize(
            $input->required('text'),
            (string) $input->optional('language', 'ko'),
        );

        return ApiResponse::json($res, ['audio_url' => $url]);
    }
}
