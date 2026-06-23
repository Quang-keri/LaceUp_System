package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.sport.backend.dto.response.address.AddressResponse;
import org.sport.backend.dto.response.city.CityResponse;
import org.sport.backend.entity.Address;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    default AddressResponse toAddressResponse(Address address) {
        if (address == null) {
            return null;
        }

        CityResponse cityResponse = null;

        if (address.getCity() != null) {
            cityResponse = CityResponse.builder()
                    .cityId(address.getCity().getCityId())
                    .cityName(address.getCity().getCityName())
                    .provinceCode(address.getCity().getProvinceCode())
                    .build();
        } else if (address.getCityName() != null) {
            cityResponse = CityResponse.builder()
                    .cityName(address.getCityName())
                    .build();
        }

        return AddressResponse.builder()
                .street(address.getStreet())
                .ward(address.getWard())
                .city(cityResponse)
                .build();
    }
}