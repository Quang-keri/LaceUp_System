package org.sport.backend.service;

import org.sport.backend.dto.request.serviceItem.ServiceItemRequest;
import org.sport.backend.dto.response.serviceItem.ServiceItemResponse;

import java.util.List;
import java.util.UUID;

public interface ServiceItemService {

    ServiceItemResponse create(ServiceItemRequest req);
    ServiceItemResponse update(UUID id, ServiceItemRequest req);
    ServiceItemResponse get(UUID id);
    List<ServiceItemResponse> getAll();
}
