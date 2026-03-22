package com.mafia.assistant.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record VoteCastRequest(
        @NotNull @Min(1) Integer seatIndex
) {
}
