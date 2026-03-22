package com.mafia.assistant.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.List;

/**
 * Полная ночь: голоса мафии, приоритет дона, жертвы, проверки, путана, маньяк.
 */
public record NightResolutionRequest(
        @Valid List<MafiaVoteDto> mafiaVotes,
        @Min(1) Integer donPreferredVictimSeat,
        @Min(1) Integer doctorSaveSeat,
        @Min(1) Integer sheriffCheckSeat,
        @Min(1) Integer donCheckSeat,
        @Min(1) Integer bomzhCheckSeat,
        @Min(1) Integer putanaTargetSeat,
        @Min(1) Integer maniacTargetSeat,
        /** Ручное подтверждение жертвы мафии при ничьей без дона */
        @Min(1) Integer mafiaVictimOverrideSeat
) {
    public NightResolutionRequest {
        mafiaVotes = mafiaVotes == null ? List.of() : mafiaVotes;
    }
}
