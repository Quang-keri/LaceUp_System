package org.sport.backend.controller;


import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.serviceItem.ServiceItemRequest;
import org.sport.backend.dto.response.serviceItem.ServiceItemResponse;
import org.sport.backend.service.ServiceItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/service-items")
public class ServiceItemController {

    @Autowired
    private ServiceItemService serviceItemService;


    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ServiceItemResponse> createServiceItem(@ModelAttribute ServiceItemRequest request) {
        ServiceItemResponse response = serviceItemService.create(request);
        return ApiResponse.success(201, "Create service item successfully", response);
    }

    @PutMapping(value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ServiceItemResponse> updateServiceItem(
            @PathVariable UUID id,
            @ModelAttribute ServiceItemRequest request) {
        ServiceItemResponse response = serviceItemService.update(id, request);
        return ApiResponse.success(200, "Update service item successfully", response);
    }

    @GetMapping("/{id}")
    public ApiResponse<ServiceItemResponse> getServiceItem(@PathVariable UUID id) {
        ServiceItemResponse response = serviceItemService.get(id);
        return ApiResponse.success(200, "Get service item successfully", response);
    }

    @GetMapping
    public ApiResponse<List<ServiceItemResponse>> getAllServiceItems() {
        List<ServiceItemResponse> responses = serviceItemService.getAll();
        return ApiResponse.success(200, "Get all service item successfully", responses);
    }
}
