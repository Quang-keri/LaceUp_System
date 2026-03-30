package org.sport.backend.controller;


import io.swagger.v3.oas.annotations.tags.Tag;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.response.city.CityResponse;
import org.sport.backend.service.CityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/cities")
public class CityController {
    @Autowired
    private CityService cityService;

    @GetMapping
    public ApiResponse<List<CityResponse>> getAllCities() {
            try {
                List<CityResponse> cities = cityService.getAll();
                return ApiResponse.success(200, "Get all cities successfully", cities);
            } catch (Exception e) {
                return ApiResponse.error(500, e.getMessage());
            }
    }

}
