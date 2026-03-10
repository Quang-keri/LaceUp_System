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
public class UpdateUserRequest {

    @Size(min = 3, max = 50, message = "USERNAME_INVALID_LENGTH")
    private String userName;

    @Pattern(regexp = "^\\d{10}$", message = "PHONE_INVALID")
    private String phone;

    private String gender;

    @Past(message = "DOB_INVALID")
    private LocalDate dateOfBirth;
}
