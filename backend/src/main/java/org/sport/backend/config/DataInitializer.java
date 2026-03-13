package org.sport.backend.config;

import lombok.RequiredArgsConstructor;
import org.sport.backend.entity.*;
import org.sport.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
   private  final CityRepository cityRepository;
   private final CategoryRepository categoryRepository;
   private final AmenityRepository amenityRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        if (roleRepository.count() == 0) {
            List<Role> roles = List.of(
                    Role.builder().roleName("ADMIN").description("Quản trị hệ thống").active(true).build(),
                    Role.builder().roleName("OWNER").description("Chủ trọ").active(true).build(),
                    Role.builder().roleName("RENTER").description("Người thuê phòng").active(true).build()
            );
            roleRepository.saveAll(roles);
        }

        Role adminRole = roleRepository.findByRoleName("ADMIN").orElse(null);
        Role ownerRole = roleRepository.findByRoleName("OWNER").orElse(null);
        Role renterRole = roleRepository.findByRoleName("RENTER").orElse(null);

        if (userRepository.count() == 0) {
            List<User> users = new ArrayList<>();
            String commonPass = "123456";

            users.add(User.builder()
                    .userName("System Admin")
                    .email("admin@gmail.com")
                    .passwordHash(passwordEncoder.encode(commonPass))
                    .role(adminRole)
                    .active(true)
                    .build());

            users.add(User.builder()
                    .userName("Best Owner")
                    .email("owner@gmail.com")
                    .passwordHash(passwordEncoder.encode(commonPass))
                    .role(ownerRole)
                    .active(true)
                    .build());

            users.add(User.builder()
                    .userName("Happy Renter")
                    .email("renter@gmail.com")
                    .passwordHash(passwordEncoder.encode(commonPass))
                    .role(renterRole)
                    .active(true)
                    .build());

            for (int i = 1; i <= 7; i++) {
                users.add(User.builder()
                        .userName("User Test " + i)
                        .email("user" + i + "@gmail.com")
                        .passwordHash(passwordEncoder.encode(commonPass))
                        .role(renterRole)
                        .active(true)
                        .dateOfBirth(LocalDate.of(2000, 1, i))
                        .build());
            }

            userRepository.saveAll(users);
        }


        if(cityRepository.count() == 0) {
            List<City> cities = new ArrayList<>();

            City city1 = City.builder()
                    .cityName("Thành Phố Hồ Chí Minh")
                    .build();
            City city2 = City.builder()
                    .cityName("Bình Dương")
                    .build();
            cities.add(city1);
            cities.add(city2);
            cityRepository.saveAll(cities);

        }


        if(categoryRepository.count() == 0) {
            seedCategories();
        }

        if(amenityRepository.count() == 0) {
            seedAmenities();
        }


    }

    private void seedCategories() {
        List<String> categories = List.of(
                "Sân cầu lông",
                "Sân bóng đá",
                "Sân pickleball"
        );

        for (String name : categories) {
            if (!categoryRepository.existsByCategoryName(name)) {
                categoryRepository.save(Category.builder()
                        .categoryName(name)
                        .build());
            }
        }
    }

    private void seedAmenities() {

        List<Amenity> amenities = List.of(
                Amenity.builder().amenityName("Wifi tốc độ cao").iconKey("FaWifi").build(),
                Amenity.builder().amenityName("Ổ điện").iconKey("FaPlug").build()
        );

        for (Amenity a : amenities) {
            if (!amenityRepository.existsByAmenityName(a.getAmenityName())) {
                amenityRepository.save(a);
            }
        }
        }
}