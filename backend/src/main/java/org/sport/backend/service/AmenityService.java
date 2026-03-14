package org.sport.backend.service;

import org.sport.backend.dto.request.amenity.CreateAmenityRequest;
import org.sport.backend.dto.request.amenity.UpdateAmenityRequest;
import org.sport.backend.dto.response.amenity.AmenityResponse;

import java.util.List;

public interface AmenityService {

    AmenityResponse createAmenity(CreateAmenityRequest request);

    AmenityResponse updateAmenity(Long amenityId, UpdateAmenityRequest request);

    void deleteAmenity(Long amenityId);

    AmenityResponse getAmenityById(Long amenityId);

    List<AmenityResponse> getAllAmenities();
}
