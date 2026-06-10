package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.sport.backend.dto.response.address.AddressResponse;
import org.sport.backend.dto.response.address.CityResponse;
import org.sport.backend.entity.Address;
import org.sport.backend.entity.City;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    AddressResponse toAddressResponse(Address address);
    CityResponse toCityResponse(City city);
}
