package com.mafia.assistant.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record VoteNominationRequest(
        @NotNull @Min(1) Integer seatIndex
) {
}
