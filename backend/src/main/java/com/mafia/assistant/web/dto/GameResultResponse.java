package com.mafia.assistant.web.dto;

import com.mafia.assistant.domain.enums.WinnerSide;
import java.time.Instant;

public record GameResultResponse(
        Long id,
        WinnerSide winnerSide,
        String summary,
        String exportText,
        Integer totalDays,
        Instant finishedAt
) {
}
