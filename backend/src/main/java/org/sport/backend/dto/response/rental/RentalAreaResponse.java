package org.sport.backend.dto.response.rental;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import org.sport.backend.constant.RentalAreaStatus;
import org.sport.backend.dto.response.city.CityResponse;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.City;
import org.sport.backend.entity.Court;
import org.sport.backend.entity.User;

import java.awt.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class RentalAreaResponse {
    UUID rentalAreaId;
    String rentalAreaName;
    String address;
    String contactName;
    String contactPhone;
    RentalAreaStatus status;
    LocalDateTime deletedAt;
    CityResponse city;
    UserResponse owner;
    List<Court> courts;
    List<RentalAreaImageResponse> images;
}
