package com.mafia.assistant.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AssignRolesRequest(
        @NotEmpty List<@Valid RoleAssignmentItem> assignments
) {
}
