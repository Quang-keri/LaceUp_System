package org.sport.backend.service;

import org.sport.backend.dto.response.city.CityResponse;

import java.util.List;

public interface CityService {
    List<CityResponse> getAll();
}
