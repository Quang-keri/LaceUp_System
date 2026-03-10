package org.sport.backend.dto.response.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private UUID userId;
    private String userName;
    private String email;
    private String gender;
    private String phone;
    private LocalDate dateOfBirth;
    private int age;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean active;
}
