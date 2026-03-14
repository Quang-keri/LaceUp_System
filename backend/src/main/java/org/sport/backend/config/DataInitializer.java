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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final CityRepository cityRepository;
    private final CategoryRepository categoryRepository;
    private final AmenityRepository amenityRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        // 1. Khởi tạo Permissions
        if (permissionRepository.count() == 0) {
            List<Permission> permissions = List.of(
                    // Quyền cho Admin (Hệ thống)
                    Permission.builder().permissionName("VIEW_DASHBOARD").description("Xem bảng điều khiển").build(),
                    Permission.builder().permissionName("MANAGE_USERS").description("Quản lý người dùng").build(),
                    Permission.builder().permissionName("MANAGE_ROLES").description("Quản lý vai trò & quyền hạn").build(),

                    // Quyền cho Owner (Chủ trọ)
                    Permission.builder().permissionName("POST_ROOM").description("Đăng tin cho thuê phòng").build(),
                    Permission.builder().permissionName("UPDATE_ROOM").description("Cập nhật thông tin phòng").build(),
                    Permission.builder().permissionName("VIEW_BOOKINGS").description("Xem danh sách đặt phòng").build(),
                    Permission.builder().permissionName("MANAGE_FINANCE").description("Quản lý tài chính/doanh thu").build(),

                    // Quyền cho Renter (Người thuê)
                    Permission.builder().permissionName("SEARCH_ROOM").description("Tìm kiếm phòng trọ").build(),
                    Permission.builder().permissionName("BOOK_ROOM").description("Thực hiện đặt phòng").build(),
                    Permission.builder().permissionName("CHAT_WITH_OWNER").description("Nhắn tin với chủ trọ").build(),
                    Permission.builder().permissionName("WRITE_REVIEW").description("Viết đánh giá phản hồi").build()
            );
            permissionRepository.saveAll(permissions);
        }

        // Lấy Map để dễ gán vào Role
        Map<String, Permission> permMap = permissionRepository.findAll().stream()
                .collect(Collectors.toMap(Permission::getPermissionName, p -> p));

        // 2. Khởi tạo Roles
        if (roleRepository.count() == 0) {
            // Role ADMIN có tất cả quyền
            Role adminRole = Role.builder()
                    .roleName("ADMIN")
                    .description("Quản trị hệ thống")
                    .active(true)
                    .permissions(new HashSet<>(permMap.values()))
                    .build();

            // Role OWNER có quyền quản lý phòng và xem dashboard
            Role ownerRole = Role.builder()
                    .roleName("OWNER")
                    .description("Chủ trọ")
                    .active(true)
                    .permissions(Set.of(
                            permMap.get("VIEW_DASHBOARD"),
                            permMap.get("POST_ROOM"),
                            permMap.get("UPDATE_ROOM"),
                            permMap.get("VIEW_BOOKINGS"),
                            permMap.get("MANAGE_FINANCE"),
                            permMap.get("CHAT_WITH_OWNER")
                    ))
                    .build();

            // Role RENTER có quyền tìm kiếm và đặt phòng
            Role renterRole = Role.builder()
                    .roleName("RENTER")
                    .description("Người thuê phòng")
                    .active(true)
                    .permissions(Set.of(
                            permMap.get("SEARCH_ROOM"),
                            permMap.get("BOOK_ROOM"),
                            permMap.get("CHAT_WITH_OWNER"),
                            permMap.get("WRITE_REVIEW")
                    ))
                    .build();

            roleRepository.saveAll(List.of(adminRole, ownerRole, renterRole));
        }

        Role adminRole = roleRepository.findByRoleName("ADMIN").orElse(null);
        Role ownerRole = roleRepository.findByRoleName("OWNER").orElse(null);
        Role renterRole = roleRepository.findByRoleName("RENTER").orElse(null);

        if (userRepository.count() == 0) {
            List<User> users = new ArrayList<>();
            String commonPass = passwordEncoder.encode("123456");

            users.add(User.builder().userName("System Admin").email("admin@gmail.com").passwordHash(commonPass).role(adminRole).active(true).build());
            users.add(User.builder().userName("Best Owner").email("owner@gmail.com").passwordHash(commonPass).role(ownerRole).active(true).build());
            users.add(User.builder().userName("Happy Renter").email("renter@gmail.com").passwordHash(commonPass).role(renterRole).active(true).build());

            for (int i = 1; i <= 7; i++) {
                users.add(User.builder()
                        .userName("User Test " + i)
                        .email("user" + i + "@gmail.com")
                        .passwordHash(commonPass)
                        .role(renterRole)
                        .active(true)
                        .dateOfBirth(LocalDate.of(2000, 1, i))
                        .build());
            }

            userRepository.saveAll(users);
        }


        if (cityRepository.count() == 0) {
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


        if (categoryRepository.count() == 0) {
            seedCategories();
        }

        if (amenityRepository.count() == 0) {
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