package org.sport.backend.serviceImpl;

import org.sport.backend.dto.response.city.CityResponse;
import org.sport.backend.entity.City;
import org.sport.backend.repository.CityRepository;
import org.sport.backend.service.CityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CityServiceImpl implements CityService {

    @Autowired
    private CityRepository cityRepository;

    @Override
    public List<CityResponse> getAll() {
        List<City> cities = cityRepository.findAll();


        return cities.stream()
                .map(city -> CityResponse.builder()
                        .cityId(city.getCityId())
                        .cityName(city.getCityName())
                        .build())
                .toList();
    }
}
