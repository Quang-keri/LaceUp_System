package org.sport.backend.dto.request.user;

import com.fasterxml.jackson.annotation.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateUserRequest {

    @NotBlank(message = "USERNAME_REQUIRED")
    @Size(min = 3, max = 50, message = "USERNAME_INVALID_SIZE")
    @Pattern(
            regexp = "^[\\p{L}0-9._ ]+$",
            message = "USERNAME_INVALID_CHARACTERS"
    )
    private String userName;

    @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "GENDER_INVALID")
    private String gender;

    @NotBlank(message = "EMAIL_REQUIRED")
    @Email(message = "EMAIL_INVALID_FORMAT")
    private String email;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(min = 8, message = "PASSWORD_MIN_LENGTH")
    private String password;

    @Pattern(regexp = "^0\\d{9}$", message = "PHONE_INVALID_FORMAT")
    private String phone;

    @NotNull(message = "DOB_REQUIRED")
    @Past(message = "DOB_MUST_BE_IN_PAST")
    private LocalDate dateOfBirth;

    @NotNull(message = "ROLE_REQUIRED")
    private String roleName;

    private String otp;
}
