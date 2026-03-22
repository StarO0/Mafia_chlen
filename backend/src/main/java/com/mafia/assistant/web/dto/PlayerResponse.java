package com.mafia.assistant.web.dto;

import com.mafia.assistant.domain.enums.PlayerRole;
import java.time.Instant;

public record PlayerResponse(
        Long id,
        Integer seatIndex,
        String name,
        PlayerRole role,
        String customRoleName,
        boolean alive,
        boolean nominatedToday,
        Integer votesReceivedToday,
        Instant eliminatedAt
) {
}
