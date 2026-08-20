-- 이음 앱 SQLite 스키마
-- PHP 서버용 (SQLAlchemy 모델과 동일)

CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE,
    created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    sub_role TEXT,
    username TEXT UNIQUE,
    password_hash TEXT,
    birth_date DATE,
    profile_image TEXT,
    fcm_token TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (family_id) REFERENCES families(id)
);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    source TEXT DEFAULT 'manual',
    from_member_id TEXT,
    to_member_id TEXT NOT NULL,
    parent_question_id TEXT,
    parent_response_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (from_member_id) REFERENCES members(id),
    FOREIGN KEY (to_member_id) REFERENCES members(id),
    FOREIGN KEY (parent_question_id) REFERENCES questions(id),
    FOREIGN KEY (parent_response_id) REFERENCES responses(id)
);

CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    content TEXT NOT NULL,
    input_method TEXT DEFAULT 'text',
    audio_file_path TEXT,
    transcript TEXT,
    transcript_en TEXT,
    era TEXT,
    duration TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS capsules (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    from_member_id TEXT NOT NULL,
    to_member_id TEXT NOT NULL,
    title TEXT NOT NULL,
    audio_file_path TEXT,
    open_date DATE NOT NULL,
    status TEXT DEFAULT 'locked',
    duration TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (from_member_id) REFERENCES members(id),
    FOREIGN KEY (to_member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS calendar_entries (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    created_by TEXT NOT NULL,
    tag TEXT,
    color TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (created_by) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    url TEXT NOT NULL,
    label TEXT,
    who TEXT,
    tone TEXT,
    uploaded_by TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (uploaded_by) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    family_id TEXT,
    member_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_read INTEGER DEFAULT 0,
    nav_target TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    title TEXT NOT NULL,
    deadline DATETIME,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (created_by) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS poll_options (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL,
    label TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id)
);

CREATE TABLE IF NOT EXISTS poll_votes (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL,
    option_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    FOREIGN KEY (poll_id) REFERENCES polls(id),
    FOREIGN KEY (option_id) REFERENCES poll_options(id),
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS member_settings (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL UNIQUE,
    font_size TEXT DEFAULT '보통',
    voice_guide INTEGER DEFAULT 1,
    auto_translate INTEGER DEFAULT 0,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    response_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (family_id) REFERENCES families(id)
);
