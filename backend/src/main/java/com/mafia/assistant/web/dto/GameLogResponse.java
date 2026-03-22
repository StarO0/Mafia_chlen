package com.mafia.assistant.web.dto;

import com.mafia.assistant.domain.enums.EventType;
import java.time.Instant;

public record GameLogResponse(
        Long id,
        Integer sequenceNo,
        EventType eventType,
        String message,
        String payloadJson,
        boolean revertible,
        Instant createdAt
) {
}
