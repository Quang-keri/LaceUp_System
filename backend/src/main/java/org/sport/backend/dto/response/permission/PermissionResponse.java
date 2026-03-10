package org.sport.backend.dto.response.permission;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionResponse {
    private Long permissionId;
    private String permissionName;
    private String description;
}