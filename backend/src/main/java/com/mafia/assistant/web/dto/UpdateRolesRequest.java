package com.mafia.assistant.web.dto;

import jakarta.validation.constraints.Min;

public record UpdateRolesRequest(
        @Min(0) Integer mafiaCount,
        @Min(0) Integer donCount,
        @Min(0) Integer sheriffCount,
        @Min(0) Integer citizenCount,
        String customRolesJson,
        Boolean paperRolesEnabled
) {
}
