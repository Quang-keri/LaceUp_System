package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.sport.backend.dto.response.court_price.CourtPriceResponse;
import org.sport.backend.entity.CourtPrice;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CourtPriceMapper {

    @Mapping(target = "courtId", source = "court.courtId")
    CourtPriceResponse toCourtPriceResponse(CourtPrice courtPrice);

    List<CourtPriceResponse> toCourtPriceResponseList(List<CourtPrice> courtPrices);

}
