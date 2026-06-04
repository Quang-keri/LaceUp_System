package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.sport.backend.dto.response.address.AddressResponse;
import org.sport.backend.entity.Address;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(target = "city", ignore = true)
    AddressResponse toAddressResponse(Address address);
}
