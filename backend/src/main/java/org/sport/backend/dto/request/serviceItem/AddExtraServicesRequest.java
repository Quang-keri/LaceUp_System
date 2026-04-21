package org.sport.backend.dto.request.serviceItem;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class AddExtraServicesRequest {
    private List<ServiceItemRequest> items;

    @Data
    public static class ServiceItemRequest {
        private UUID serviceId;
        private Integer quantity;
    }
}
