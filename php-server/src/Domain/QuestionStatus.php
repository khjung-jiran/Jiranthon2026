<?php

declare(strict_types=1);

namespace Eum\Domain;

enum QuestionStatus: string
{
    case Pending = 'pending';
    case Answered = 'answered';
}
