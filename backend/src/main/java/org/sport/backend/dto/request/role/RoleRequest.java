package org.sport.backend.dto.request.role;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleRequest {
    @NotBlank(message = "ROLE_NAME_REQUIRED")
    private String roleName;

    private String description;
}
