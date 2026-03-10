package org.sport.backend.properties;

import lombok.AccessLevel;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "google.client")
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClientProperties {
    String id;
    String secret;
    String uri;
}
