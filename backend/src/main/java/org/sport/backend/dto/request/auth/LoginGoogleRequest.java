package org.sport.backend.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginGoogleRequest {

    @NotBlank(message = "AUTH_CODE_INVALID")
    String code;
}
