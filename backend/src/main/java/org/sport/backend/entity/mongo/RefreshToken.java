package org.sport.backend.entity.mongo;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "refresh_tokens")
public class RefreshToken {

    @Id
    String id;

    @Indexed(unique = true)
    String tokenHash;

    String email;

    @Indexed(expireAfter = "0s")
    Instant expiresAt;

    boolean revoked;
}
