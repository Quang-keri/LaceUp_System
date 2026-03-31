package org.sport.backend.properties;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.ai.vector")
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatBoxProperties {
    double threshold;
    int topK;
}
