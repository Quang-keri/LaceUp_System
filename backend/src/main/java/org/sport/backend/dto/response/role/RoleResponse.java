package org.sport.backend.dto.response.role;

import lombok.*;
import org.sport.backend.dto.response.permission.PermissionResponse;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleResponse {
    private Long roleId;
    private String roleName;
    private String description;
    private boolean active;
    private Set<PermissionResponse> permissions;
}
