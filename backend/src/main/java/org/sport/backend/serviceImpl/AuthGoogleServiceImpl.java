package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.response.auth.LoginGoogleResponse;
import org.sport.backend.properties.ClientProperties;
import org.sport.backend.service.AuthGoogleService;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthGoogleServiceImpl implements AuthGoogleService {

    private final WebClient webClient = WebClient.create();
    private final ClientProperties clientProperties;

    @Override
    public LoginGoogleResponse authenticate(String code) {

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("code", code);
        formData.add("client_id", clientProperties.getId());
        formData.add("client_secret", clientProperties.getSecret());
        formData.add("redirect_uri", "postmessage");
        formData.add("grant_type", "authorization_code");

        // Log xem mình gửi cái gì lên Google
        log.info("Sending params to Google: client_id={}, redirect_uri={}",
                clientProperties.getId(), clientProperties.getUri());

        try {
            // BƯỚC 1: Lấy Access Token
            Map response = webClient.post()
                    .uri("https://oauth2.googleapis.com/token")
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .body(BodyInserters.fromFormData(formData))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            String accessToken = (String) response.get("access_token");
            log.info("Get Access Token Success: {}", accessToken != null ? "YES" : "NO");

            // BƯỚC 2: Lấy thông tin User
            return webClient.get()
                    .uri("https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" + accessToken)
                    .retrieve()
                    .bodyToMono(LoginGoogleResponse.class)
                    .block();

        } catch (WebClientResponseException e) {
            log.error("GOOGLE ERROR STATUS: {}", e.getStatusCode());
            log.error("GOOGLE ERROR BODY: {}", e.getResponseBodyAsString());
            throw e;
        } catch (Exception ex) {
            log.error("UNKNOWN ERROR: ", ex);
            throw new RuntimeException(ex);
        }
    }
}
