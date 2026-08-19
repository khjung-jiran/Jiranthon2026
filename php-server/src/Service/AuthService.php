<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Exception\UnauthorizedException;
use Eum\Repository\FamilyRepository;
use Eum\Repository\MemberRepository;
use Eum\Support\Logger;

final class AuthService
{
    public function __construct(
        private readonly MemberRepository $members,
        private readonly FamilyRepository $families,
        private readonly PasswordHasher $hasher,
        private readonly Logger $logger,
    ) {
    }

    /**
     * 아이디·비밀번호를 검증한다.
     *
     * 아이디가 없는 경우와 비밀번호가 틀린 경우를 동일한 메시지로 응답해서
     * 계정 존재 여부가 새어나가지 않게 한다.
     *
     * @return array{member: array<string, mixed>, family: array<string, mixed>|null}
     */
    public function login(string $username, string $password): array
    {
        $member = $this->members->findByUsername($username);
        $storedHash = $member['password_hash'] ?? null;

        if ($member === null || !\is_string($storedHash) || $storedHash === '') {
            throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
        }

        if (!$this->hasher->verify($password, $storedHash)) {
            $this->logger->warning("로그인 실패: {$username}");

            throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
        }

        // 레거시 sha256 해시를 bcrypt 로 승급한다.
        if ($this->hasher->needsRehash($storedHash)) {
            $this->members->updatePasswordHash((string) $member['id'], $this->hasher->hash($password));
            $this->logger->info("비밀번호 해시 승급: 멤버={$member['id']}");
        }

        $this->logger->info("로그인: {$username} / 멤버={$member['id']}");

        return [
            'member' => $member,
            'family' => $this->families->find((string) $member['family_id']),
        ];
    }
}
