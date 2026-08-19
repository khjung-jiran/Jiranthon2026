<?php

declare(strict_types=1);

namespace Eum\Service;

/**
 * 비밀번호 해싱.
 *
 * 기존 구현은 솔트 없는 단순 `sha256` 이었다 — 레인보우 테이블에 무방비다.
 * 이제 bcrypt 를 쓰되, 이미 저장된 sha256 해시도 검증할 수 있게 두고
 * 로그인 성공 시점에 조용히 bcrypt 로 다시 해싱한다 (계정이 깨지지 않는다).
 */
final class PasswordHasher
{
    private const ALGORITHM = \PASSWORD_BCRYPT;

    public function hash(string $plain): string
    {
        return \password_hash($plain, self::ALGORITHM);
    }

    public function verify(string $plain, string $storedHash): bool
    {
        if ($this->isLegacySha256($storedHash)) {
            return \hash_equals($storedHash, \hash('sha256', $plain));
        }

        return \password_verify($plain, $storedHash);
    }

    /**
     * 저장된 해시를 다시 만들어야 하는지 판단한다.
     * 레거시 sha256 이거나 bcrypt 파라미터가 낡은 경우 참.
     */
    public function needsRehash(string $storedHash): bool
    {
        return $this->isLegacySha256($storedHash)
            || \password_needs_rehash($storedHash, self::ALGORITHM);
    }

    /** 솔트 없는 sha256 은 소문자 16진수 64자다. bcrypt 는 `$2y$` 로 시작한다. */
    private function isLegacySha256(string $hash): bool
    {
        return \strlen($hash) === 64 && \ctype_xdigit($hash);
    }
}
