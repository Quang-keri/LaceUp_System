package org.sport.backend.serviceImpl;

import org.sport.backend.dto.request.court_price.CourtPriceRequest;
import org.sport.backend.dto.response.court_price.CourtPriceResponse;
import org.sport.backend.entity.Court;
import org.sport.backend.entity.CourtPrice;
import org.sport.backend.repository.CourtPriceRepository;
import org.sport.backend.repository.CourtRepository;
import org.sport.backend.service.CourtPriceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CourtPriceServiceImpl implements CourtPriceService {

    @Autowired
    private CourtPriceRepository courtPriceRepository;
    @Autowired
    private CourtRepository courtRepository;

    @Override
    public CourtPriceResponse create(CourtPriceRequest request) {

        Court court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new RuntimeException("Court not found"));

        CourtPrice price = CourtPrice.builder()
                .court(court)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .pricePerHour(request.getPricePerHour())
                .specificDate(request.getSpecificDate())
                .priceType(request.getPriceType())
                .priority(request.getPriority())
                .build();

        return mapToResponse(courtPriceRepository.save(price));
    }

    @Override
    public List<CourtPriceResponse> getByCourt(UUID courtId) {

        return courtPriceRepository.findByCourt_CourtId(courtId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CourtPriceResponse update(UUID id, CourtPriceRequest request) {

        CourtPrice price = courtPriceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourtPrice not found"));

        if (request.getStartTime() != null) price.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) price.setEndTime(request.getEndTime());
        if (request.getPricePerHour() != null) price.setPricePerHour(request.getPricePerHour());
        if (request.getSpecificDate() != null) price.setSpecificDate(request.getSpecificDate());
        if (request.getPriceType() != null) price.setPriceType(request.getPriceType());
        if (request.getPriority() != null) price.setPriority(request.getPriority());

        return mapToResponse(courtPriceRepository.save(price));
    }

    @Override
    public void delete(UUID id) {
        courtPriceRepository.deleteById(id);
    }

    private CourtPriceResponse mapToResponse(CourtPrice p) {
        return CourtPriceResponse.builder()
                .courtPriceId(p.getCourtPriceId())
                .courtId(p.getCourt().getCourtId())
                .startTime(p.getStartTime())
                .endTime(p.getEndTime())
                .pricePerHour(p.getPricePerHour())
                .specificDate(p.getSpecificDate())
                .priceType(p.getPriceType())
                .priority(p.getPriority())
                .build();
    }
}