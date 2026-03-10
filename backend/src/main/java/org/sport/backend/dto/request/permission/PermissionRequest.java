package org.sport.backend.dto.request.permission;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionRequest {
    @NotBlank(message = "PERMISSION_NAME_REQUIRED")
    private String permissionName;

    private String description;
}