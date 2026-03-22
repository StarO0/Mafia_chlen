package com.mafia.assistant.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record MafiaVoteDto(
        @NotNull @Min(1) Integer voterSeat,
        @NotNull @Min(1) Integer targetSeat
) {
}
