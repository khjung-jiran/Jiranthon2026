<?php

declare(strict_types=1);

namespace Eum\Domain;

enum CapsuleStatus: string
{
    /** 개봉일 이전 */
    case Locked = 'locked';
    /** 개봉일 도달, 아직 열지 않음 */
    case Ready = 'ready';
    /** 수신자가 열었음 */
    case Opened = 'open';
}
