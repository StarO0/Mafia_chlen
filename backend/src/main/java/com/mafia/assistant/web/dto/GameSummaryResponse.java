package com.mafia.assistant.web.dto;

import com.mafia.assistant.domain.enums.GameStatus;
import com.mafia.assistant.domain.enums.PhaseType;
import java.time.Instant;

public record GameSummaryResponse(
        Long id,
        GameStatus status,
        PhaseType phase,
        Integer totalPlayers,
        Instant createdAt
) {
}
