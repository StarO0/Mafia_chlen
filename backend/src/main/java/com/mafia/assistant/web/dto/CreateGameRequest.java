package com.mafia.assistant.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateGameRequest(
        @NotNull @Min(4) @Max(20) Integer playerCount,
        @NotEmpty @Size(max = 20) List<@NotNull @Size(min = 1, max = 120) String> playerNames
) {
}
