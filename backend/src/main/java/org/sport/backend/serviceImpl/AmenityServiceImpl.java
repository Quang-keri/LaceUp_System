package org.sport.backend.serviceImpl;

import org.sport.backend.dto.request.amenity.CreateAmenityRequest;
import org.sport.backend.dto.request.amenity.UpdateAmenityRequest;
import org.sport.backend.dto.response.amenity.AmenityResponse;
import org.sport.backend.entity.Amenity;
import org.sport.backend.repository.AmenityRepository;
import org.sport.backend.service.AmenityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service

public class AmenityServiceImpl implements AmenityService {

    @Autowired
   private AmenityRepository amenityRepository;

    @Override
    public AmenityResponse createAmenity(CreateAmenityRequest request) {

        if (amenityRepository.existsByAmenityName(request.getAmenityName())) {
            throw new RuntimeException("Amenity name already exists");
        }

        Amenity amenity = Amenity.builder()
                .amenityName(request.getAmenityName())
                .iconKey(request.getIconKey())
                .build();

        amenityRepository.save(amenity);

        return mapToResponse(amenity);
    }

    @Override
    public AmenityResponse updateAmenity(Long amenityId, UpdateAmenityRequest request) {

        Amenity amenity = amenityRepository.findById(amenityId)
                .orElseThrow(() -> new RuntimeException("Amenity not found"));

        amenity.setAmenityName(request.getAmenityName());
        amenity.setIconKey(request.getIconKey());

        amenityRepository.save(amenity);

        return mapToResponse(amenity);
    }

    @Override
    public void deleteAmenity(Long amenityId) {

        Amenity amenity = amenityRepository.findById(amenityId)
                .orElseThrow(() -> new RuntimeException("Amenity not found"));

        amenityRepository.delete(amenity);
    }

    @Override
    public AmenityResponse getAmenityById(Long amenityId) {

        Amenity amenity = amenityRepository.findById(amenityId)
                .orElseThrow(() -> new RuntimeException("Amenity not found"));

        return mapToResponse(amenity);
    }

    @Override
    public List<AmenityResponse> getAllAmenities() {

        return amenityRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private AmenityResponse mapToResponse(Amenity amenity) {
        return AmenityResponse.builder()
                .amenityId(amenity.getAmenityId())
                .amenityName(amenity.getAmenityName())
                .iconKey(amenity.getIconKey())
                .build();
    }
}
