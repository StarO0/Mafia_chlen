package com.mafia.assistant.web.dto;

import com.mafia.assistant.domain.enums.PlayerRole;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RoleAssignmentItem(
        @NotNull @Min(1) Integer seatIndex,
        @NotNull PlayerRole role,
        @Size(max = 120) String customRoleName
) {
}
