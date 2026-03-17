package org.sport.backend.config;

import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.sport.backend.constant.AuthProvider;
import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.constant.CourtStatus;
import org.sport.backend.constant.PriceType;
import org.sport.backend.entity.*;
import org.sport.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
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
    private final CourtRepository courtRepository;
    private final CourtPriceRepository courtPriceRepository;
    private final RentalAreaRepository rentalAreaRepository;
    private final CourtCopyRepository courtCopyRepository;

    @Override
    @Transactional
    public void run(String @NonNull ... args) {


        if (permissionRepository.count() == 0) {
            List<Permission> permissions = List.of(
                    // Quyền cho Admin (Hệ thống)
                    Permission.builder().permissionName("VIEW_DASHBOARD").description("Xem bảng điều khiển").build(),
                    Permission.builder().permissionName("MANAGE_USERS").description("Quản lý người dùng").build(),
                    Permission.builder().permissionName("MANAGE_ROLES").description("Quản lý vai trò & quyền hạn").build(),

                    // Quyền cho Staff (Nhân viên vận hành) - MỚI
                    Permission.builder().permissionName("APPROVE_POST").description("Duyệt tin đăng sân/phòng").build(),
                    Permission.builder().permissionName("SUPPORT_CUSTOMER").description("Hỗ trợ giải quyết khiếu nại").build(),
                    Permission.builder().permissionName("VIEW_REPORT").description("Xem báo cáo hệ thống").build(),

                    // Quyền cho Owner (Chủ sân/trọ)
                    Permission.builder().permissionName("POST_ROOM").description("Đăng tin cho thuê").build(),
                    Permission.builder().permissionName("UPDATE_ROOM").description("Cập nhật thông tin phòng").build(),
                    Permission.builder().permissionName("VIEW_BOOKINGS").description("Xem danh sách đặt phòng").build(),
                    Permission.builder().permissionName("MANAGE_FINANCE").description("Quản lý tài chính/doanh thu").build(),

                    // Quyền cho Renter (Người thuê)
                    Permission.builder().permissionName("SEARCH_ROOM").description("Tìm kiếm phòng trọ").build(),
                    Permission.builder().permissionName("BOOK_ROOM").description("Thực hiện đặt phòng").build(),
                    Permission.builder().permissionName("CHAT_WITH_OWNER").description("Nhắn tin trao đổi").build(),
                    Permission.builder().permissionName("WRITE_REVIEW").description("Viết đánh giá phản hồi").build()
            );
            permissionRepository.saveAll(permissions);
        }


        Map<String, Permission> permMap = permissionRepository.findAll().stream()
                .collect(Collectors.toMap(Permission::getPermissionName, p -> p));


        if (roleRepository.count() == 0) {
            // Role ADMIN có tất cả quyền
            Role adminRole = Role.builder()
                    .roleName("ADMIN")
                    .description("Quản trị hệ thống toàn diện")
                    .active(true)
                    .permissions(new HashSet<>(permMap.values()))
                    .build();

            // STAFF: Quản lý nội dung và hỗ trợ, xem dashboard chung
            Role staffRole = Role.builder()
                    .roleName("STAFF")
                    .description("Nhân viên vận hành hệ thống")
                    .active(true)
                    .permissions(Set.of(
                            permMap.get("VIEW_DASHBOARD"),
                            permMap.get("APPROVE_POST"),
                            permMap.get("SUPPORT_CUSTOMER"),
                            permMap.get("VIEW_REPORT"),
                            permMap.get("SEARCH_ROOM")
                    ))
                    .build();

            // OWNER
            Role ownerRole = Role.builder()
                    .roleName("OWNER")
                    .description("Chủ sở hữu cơ sở kinh doanh")
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

            // RENTER
            Role renterRole = Role.builder()
                    .roleName("RENTER")
                    .description("Khách hàng/Người thuê")
                    .active(true)
                    .permissions(Set.of(
                            permMap.get("SEARCH_ROOM"),
                            permMap.get("BOOK_ROOM"),
                            permMap.get("CHAT_WITH_OWNER"),
                            permMap.get("WRITE_REVIEW")
                    ))
                    .build();

            roleRepository.saveAll(List.of(adminRole, staffRole, ownerRole, renterRole));
        }

        Role adminRole = roleRepository.findByRoleName("ADMIN").orElse(null);
        Role ownerRole = roleRepository.findByRoleName("OWNER").orElse(null);
        Role staffRole = roleRepository.findByRoleName("STAFF").orElse(null);
        Role renterRole = roleRepository.findByRoleName("RENTER").orElse(null);

        if (userRepository.count() == 0) {

            String commonPass = passwordEncoder.encode("123456");

            List<User> users = new ArrayList<>();

            // Admin
            users.add(User.builder()
                    .userName("System Admin")
                    .email("admin@gmail.com")
                    .passwordHash(commonPass)
                    .gender("Male")
                    .phone("0901112223")
                    .dateOfBirth(LocalDate.of(1990, 5, 20))
                    .provider(AuthProvider.LOCAL)
                    .role(adminRole)
                    .active(true)
                    .build());

            // Staff
            users.add(User.builder()
                    .userName("Staff Nguyen")
                    .email("staff@gmail.com")
                    .passwordHash(commonPass)
                    .gender("Female")
                    .phone("0904445556")
                    .dateOfBirth(LocalDate.of(1995, 10, 15))
                    .provider(AuthProvider.LOCAL)
                    .role(staffRole)
                    .active(true)
                    .build());

            // Owner
            users.add(User.builder()
                    .userName("Pro Owner")
                    .email("owner@gmail.com")
                    .passwordHash(commonPass)
                    .gender("Male")
                    .phone("0907778889")
                    .dateOfBirth(LocalDate.of(1985, 2, 10))
                    .provider(AuthProvider.LOCAL)
                    .role(ownerRole)
                    .active(true)
                    .build());

            users.add(User.builder()
                    .userName("Renter Best")
                    .email("renter@gmail.com")
                    .passwordHash(commonPass)
                    .gender("Male")
                    .phone("0907778811")
                    .dateOfBirth(LocalDate.of(1989, 6, 18))
                    .provider(AuthProvider.LOCAL)
                    .role(ownerRole)
                    .active(true)
                    .build());

            // Renter Test Users
            for (int i = 1; i <= 3; i++) {
                users.add(User.builder()
                        .userName("Renter " + i)
                        .email("user" + i + "@gmail.com")
                        .passwordHash(commonPass)
                        .gender(i % 2 == 0 ? "Female" : "Male")
                        .phone("091200000" + i)
                        .dateOfBirth(LocalDate.of(2000, i, 1))
                        .provider(AuthProvider.LOCAL)
                        .role(renterRole)
                        .active(true)
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
        if (courtRepository.count() == 0) {
            seedCourtData(adminRole);
        }

    }

    private void seedCourtData(Role adminRole) {

        User admin = userRepository.findByEmail("admin@gmail.com")
                .orElseThrow();

        City city = cityRepository.findAll().get(0);
        Category category = categoryRepository.findAll().get(0);


        RentalArea area = RentalArea.builder()
                .rentalAreaName("Sân cầu lông Quận 7")
                .address("123 Nguyễn Văn Linh")
                .city(city)
                .owner(admin)
                .isActive(true)
                .build();

        rentalAreaRepository.save(area);


        Court court = Court.builder()
                .courtName("Sân A")
                .surfaceType("Thảm")
                .price(BigDecimal.valueOf(50000))
                .courtStatus(CourtStatus.ACTIVE)
                .indoor(true)
                .rentalArea(area)
                .category(category)
                .build();

        courtRepository.save(court);


        List<CourtCopy> copies = new ArrayList<>();

        for (int i = 1; i <= 3; i++) {
            CourtCopy copy = CourtCopy.builder()
                    .court(court)
                    .courtCode("A" + i)
                    .courtCopyStatus(CourtCopyStatus.ACTIVE)
                    .build();

            copies.add(copy);
        }

        courtCopyRepository.saveAll(copies);


        List<CourtPrice> prices = List.of(

                CourtPrice.builder()
                        .court(court)
                        .startTime(LocalTime.of(7, 0))
                        .endTime(LocalTime.of(17, 0))
                        .pricePerHour(BigDecimal.valueOf(50000))
                        .priceType(PriceType.NORMAL)
                        .priority(1)
                        .build(),

                CourtPrice.builder()
                        .court(court)
                        .startTime(LocalTime.of(17, 0))
                        .endTime(LocalTime.of(23, 0))
                        .pricePerHour(BigDecimal.valueOf(70000))
                        .priceType(PriceType.NORMAL)
                        .priority(1)
                        .build()
        );

        courtPriceRepository.saveAll(prices);
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