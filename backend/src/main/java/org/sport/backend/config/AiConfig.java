package org.sport.backend.config;

import org.springframework.ai.google.genai.GoogleGenAiEmbeddingConnectionDetails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Value("${spring.ai.google.genai.api-key}")
    private String apiKey;

    @Bean
    public GoogleGenAiEmbeddingConnectionDetails googleGenAiEmbeddingConnectionDetails() {
        return GoogleGenAiEmbeddingConnectionDetails.builder()
                .apiKey(apiKey)
                // Tuyệt đối KHÔNG gọi .projectId() và .location() ở đây
                .build();
    }
}