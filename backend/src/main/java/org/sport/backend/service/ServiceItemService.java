package org.sport.backend.service;

import org.sport.backend.dto.request.serviceItem.ServiceItemRequest;
import org.sport.backend.dto.response.serviceItem.ServiceItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ServiceItemService {

    ServiceItemResponse create(ServiceItemRequest req);
    ServiceItemResponse update(UUID id, ServiceItemRequest req);
    ServiceItemResponse get(UUID id);
    List<ServiceItemResponse> getAll();

    List<ServiceItemResponse> getByRentalArea(UUID rentalAreaId);
    void delete(UUID id);

    Page<ServiceItemResponse> searchItems(String email, String keyword, Pageable pageable);
}
