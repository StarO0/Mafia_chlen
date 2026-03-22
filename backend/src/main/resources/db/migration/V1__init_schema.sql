CREATE TABLE games
(
    id                  BIGSERIAL PRIMARY KEY,
    status              VARCHAR(20)  NOT NULL,
    phase               VARCHAR(10)  NOT NULL,
    current_day_number  INTEGER      NOT NULL DEFAULT 1,
    speaker_seat_index  INTEGER,
    paper_roles_enabled BOOLEAN      NOT NULL DEFAULT FALSE,
    total_players       INTEGER      NOT NULL,
    mafia_count         INTEGER      NOT NULL,
    don_count           INTEGER      NOT NULL,
    sheriff_count       INTEGER      NOT NULL,
    citizen_count       INTEGER      NOT NULL,
    custom_roles_json   VARCHAR(4000),
    undo_cursor         INTEGER      NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_games_status CHECK (status IN ('SETUP', 'ACTIVE', 'FINISHED', 'CANCELLED')),
    CONSTRAINT chk_games_phase CHECK (phase IN ('DAY', 'NIGHT')),
    CONSTRAINT chk_games_players_positive CHECK (total_players > 0),
    CONSTRAINT chk_games_day_positive CHECK (current_day_number > 0)
);

CREATE INDEX idx_games_status ON games (status);
CREATE INDEX idx_games_created_at ON games (created_at);

CREATE TABLE players
(
    id                   BIGSERIAL PRIMARY KEY,
    game_id              BIGINT        NOT NULL REFERENCES games (id) ON DELETE CASCADE,
    name                 VARCHAR(120)  NOT NULL,
    seat_index           INTEGER       NOT NULL,
    role                 VARCHAR(20)   NOT NULL,
    custom_role_name     VARCHAR(120),
    alive                BOOLEAN       NOT NULL DEFAULT TRUE,
    is_nominated_today   BOOLEAN       NOT NULL DEFAULT FALSE,
    votes_received_today INTEGER       NOT NULL DEFAULT 0,
    eliminated_at        TIMESTAMPTZ,
    CONSTRAINT uk_players_game_seat UNIQUE (game_id, seat_index),
    CONSTRAINT chk_players_role CHECK (role IN ('CITIZEN', 'MAFIA', 'DON', 'SHERIFF', 'DOCTOR', 'ESCORT', 'MANIAC', 'CUSTOM')),
    CONSTRAINT chk_players_seat_positive CHECK (seat_index > 0),
    CONSTRAINT chk_players_votes_nonnegative CHECK (votes_received_today >= 0)
);

CREATE INDEX idx_players_game_id ON players (game_id);
CREATE INDEX idx_players_game_alive ON players (game_id, alive);

CREATE TABLE game_logs
(
    id          BIGSERIAL PRIMARY KEY,
    game_id     BIGINT         NOT NULL REFERENCES games (id) ON DELETE CASCADE,
    sequence_no INTEGER        NOT NULL,
    event_type  VARCHAR(40)    NOT NULL,
    message     VARCHAR(1000)  NOT NULL,
    payload_json VARCHAR(4000),
    revertible  BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_game_logs_game_sequence UNIQUE (game_id, sequence_no),
    CONSTRAINT chk_game_logs_event_type CHECK (event_type IN (
        'GAME_CREATED',
        'GAME_STARTED',
        'PHASE_CHANGED',
        'ROLE_ASSIGNED',
        'NIGHT_ACTION',
        'NIGHT_RESULT',
        'PLAYER_ELIMINATED',
        'PLAYER_RESTORED',
        'VOTE_STARTED',
        'VOTE_CAST',
        'VOTE_RESULT',
        'WARNING_CONFIRMED',
        'UNDO_APPLIED',
        'GAME_FINISHED',
        'NOTE'
    ))
);

CREATE INDEX idx_game_logs_game_id ON game_logs (game_id);
CREATE INDEX idx_game_logs_game_created_at ON game_logs (game_id, created_at);

CREATE TABLE game_results
(
    id          BIGSERIAL PRIMARY KEY,
    game_id     BIGINT         NOT NULL UNIQUE REFERENCES games (id) ON DELETE CASCADE,
    winner_side VARCHAR(20)    NOT NULL,
    summary     VARCHAR(2000)  NOT NULL,
    export_text VARCHAR(4000)  NOT NULL,
    total_days  INTEGER        NOT NULL,
    finished_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_game_results_winner_side CHECK (winner_side IN ('CIVILIANS', 'MAFIA', 'MANIAC', 'DRAW')),
    CONSTRAINT chk_game_results_total_days_positive CHECK (total_days > 0)
);

CREATE INDEX idx_game_results_finished_at ON game_results (finished_at);
