package com.mafia.assistant.web.dto;

import jakarta.validation.constraints.Min;

public record NightResolutionRequest(
        @Min(1) Integer mafiaTargetSeat,
        @Min(1) Integer doctorSaveSeat,
        @Min(1) Integer sheriffCheckSeat,
        @Min(1) Integer donCheckSeat
) {
}
