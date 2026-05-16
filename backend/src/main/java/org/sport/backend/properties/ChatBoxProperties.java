package org.sport.backend.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.ai.vector")
@Getter
@Setter
public class ChatBoxProperties {
    private double threshold;
    private int topK;
}
