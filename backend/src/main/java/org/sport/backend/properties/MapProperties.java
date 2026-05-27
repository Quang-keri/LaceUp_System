package org.sport.backend.properties;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "goong")
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MapProperties {
    private String apiKey;
}
