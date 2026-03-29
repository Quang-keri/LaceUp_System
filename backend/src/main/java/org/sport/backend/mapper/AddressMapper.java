package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.sport.backend.dto.response.address.AddressResponse;
import org.sport.backend.entity.Address;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    AddressResponse toAddressResponse(Address address);
}
