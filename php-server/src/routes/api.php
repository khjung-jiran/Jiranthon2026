<?php

declare(strict_types=1);

use Eum\Container;
use Eum\Http\ApiResponse;
use Slim\App;
use Slim\Psr7\Response;

/**
 * @param App<Response> $app
 */
return static function (App $app, Container $c): void {
    $families   = $c->familyController();
    $questions  = $c->questionController();
    $responses  = $c->responseController();
    $storybook  = $c->storybookController();
    $capsules   = $c->capsuleController();
    $calendar   = $c->calendarController();
    $album      = $c->albumController();
    $notifs     = $c->notificationController();
    $polls      = $c->pollController();
    $settings   = $c->settingsController();
    $voice      = $c->voiceController();
    $uploads    = $c->uploadController();
    $media      = $c->mediaController();

    // ── Family / Auth ──
    $app->post('/api/families', [$families, 'createFamily']);
    $app->get('/api/families/{family_id}', [$families, 'getFamily']);
    $app->get('/api/families/{family_id}/invite-code', [$families, 'getInviteCode']);
    $app->post('/api/families/join', [$families, 'joinFamily']);
    $app->post('/api/members', [$families, 'createMember']);
    $app->post('/api/auth/login', [$families, 'login']);
    $app->get('/api/families/{family_id}/members', [$families, 'listMembers']);
    $app->delete('/api/members/{member_id}', [$families, 'deleteMember']);
    $app->post('/api/members/{member_id}/join-family', [$families, 'joinFamilyByMember']);
    $app->post('/api/members/{member_id}/fcm-token', [$families, 'registerFcmToken']);

    // ── Questions ──
    $app->post('/api/questions', [$questions, 'create']);
    $app->get('/api/questions', [$questions, 'index']);
    $app->get('/api/questions/ai-suggestions', [$questions, 'suggestions']);
    $app->post('/api/questions/seed', [$questions, 'seed']);
    $app->get('/api/questions/{qid}', [$questions, 'show']);
    $app->delete('/api/questions/{qid}', [$questions, 'destroy']);

    // ── Responses ──
    $app->post('/api/responses', [$responses, 'create']);
    $app->get('/api/responses', [$responses, 'index']);
    $app->get('/api/responses/stats', [$questions, 'stats']);

    // ── Storybook ──
    $app->get('/api/storybook', [$storybook, 'show']);
    $app->post('/api/storybook', [$storybook, 'regenerate']);

    // ── Capsule ──
    $app->post('/api/capsules', [$capsules, 'create']);
    $app->get('/api/capsules', [$capsules, 'index']);
    $app->get('/api/capsules/ready', [$capsules, 'ready']);
    $app->get('/api/capsules/{cid}', [$capsules, 'show']);
    $app->post('/api/capsules/{cid}/open', [$capsules, 'open']);

    // ── Calendar ──
    $app->post('/api/calendar/entries', [$calendar, 'create']);
    $app->get('/api/calendar/entries', [$calendar, 'index']);
    $app->delete('/api/calendar/entries/{eid}', [$calendar, 'destroy']);

    // ── Album ──
    $app->get('/api/album', [$album, 'index']);
    $app->delete('/api/album/{pid}', [$album, 'destroy']);

    // ── Notification ──
    $app->post('/api/notifications', [$notifs, 'create']);
    $app->get('/api/notifications', [$notifs, 'index']);
    $app->get('/api/notifications/unread-count', [$notifs, 'unreadCount']);
    $app->post('/api/notifications/{nid}/read', [$notifs, 'markRead']);
    $app->post('/api/notifications/read-all', [$notifs, 'markAllRead']);

    // ── Poll ──
    $app->post('/api/polls', [$polls, 'create']);
    $app->get('/api/polls', [$polls, 'index']);
    $app->get('/api/polls/{pid}', [$polls, 'show']);
    $app->post('/api/polls/{pid}/vote', [$polls, 'vote']);

    // ── Settings ──
    $app->get('/api/settings', [$settings, 'show']);
    $app->put('/api/settings', [$settings, 'update']);

    // ── Voice ──
    $app->post('/api/stt/transcribe', [$voice, 'transcribe']);
    $app->post('/api/tts/synthesize', [$voice, 'synthesize']);

    // ── Uploads ──
    $app->post('/api/uploads/audio', [$uploads, 'audio']);
    $app->post('/api/uploads/image', [$uploads, 'image']);

    // ── Media (업로드 파일 서빙) ──
    $app->get('/api/audio/{filename}', [$media, 'audio']);
    $app->get('/api/image/{filename}', [$media, 'image']);

    // ── Health ──
    $app->get('/api', static function ($req, Response $res): Response {
        return ApiResponse::json($res, [
            'service' => '이음 API',
            'version' => '2.0',
            'php' => \PHP_VERSION,
        ]);
    });
};
