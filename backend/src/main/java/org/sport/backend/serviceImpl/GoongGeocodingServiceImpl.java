package org.sport.backend.serviceImpl;

import org.sport.backend.properties.MapProperties;
import org.sport.backend.service.GoongGeocodingService;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class GoongGeocodingServiceImpl implements GoongGeocodingService {

    private final RestClient restClient;
    private final MapProperties mapProperties;

    public GoongGeocodingServiceImpl(MapProperties mapProperties) {
        this.restClient = RestClient.create();
        this.mapProperties = mapProperties;
    }

    @Override
    public double[] getCoordinates(String address) {
        String url = "https://rsapi.goong.io/geocode?address={address}&api_key={key}";

        try {
            String apiKey = mapProperties.getApiKey();
            System.out.println("API Key đang dùng là: " + apiKey);

            JsonNode response = restClient.get()
                    .uri(url, address, apiKey)
                    .retrieve()
                    .body(JsonNode.class);

            if (response != null && "OK".equals(response.get("status").asText())) {
                JsonNode location = response.get("results").get(0).get("geometry").get("location");
                double lat = location.get("lat").asDouble();
                double lng = location.get("lng").asDouble();

                return new double[]{lat, lng};
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi gọi Goong Geocoding API: " + e.getMessage());
        }
        return null;
    }
}
