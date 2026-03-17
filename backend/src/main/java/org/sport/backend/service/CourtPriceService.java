package org.sport.backend.service;

import org.sport.backend.dto.request.court_price.CourtPriceRequest;
import org.sport.backend.dto.response.court_price.CourtPriceResponse;

import java.util.List;
import java.util.UUID;

public interface CourtPriceService {

    CourtPriceResponse create(CourtPriceRequest request);

    List<CourtPriceResponse> getByCourt(UUID courtId);

    CourtPriceResponse update(UUID id, CourtPriceRequest request);

    void delete(UUID id);
}
