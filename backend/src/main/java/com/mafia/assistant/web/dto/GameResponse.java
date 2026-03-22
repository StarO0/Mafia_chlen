package com.mafia.assistant.web.dto;

import com.mafia.assistant.domain.enums.GameStatus;
import com.mafia.assistant.domain.enums.PhaseType;
import java.time.Instant;
import java.util.List;

public record GameResponse(
        Long id,
        GameStatus status,
        PhaseType phase,
        Integer currentDayNumber,
        Integer speakerSeatIndex,
        boolean paperRolesEnabled,
        Integer totalPlayers,
        Integer mafiaCount,
        Integer donCount,
        Integer sheriffCount,
        Integer citizenCount,
        String customRolesJson,
        Integer undoCursor,
        Instant createdAt,
        Instant updatedAt,
        List<PlayerResponse> players,
        List<GameLogResponse> logs,
        GameResultResponse result
) {
}
