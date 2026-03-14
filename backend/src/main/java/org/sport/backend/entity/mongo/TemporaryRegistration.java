package org.sport.backend.entity.mongo;

import lombok.Builder;
import lombok.Data;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "temporary_registration")
@Data
@Builder
public class TemporaryRegistration {
    @Id
    String email;

    CreateUserRequest userRequest;

    String otp;

    @Indexed(expireAfter = "300s")
    LocalDateTime createdAt;
}
