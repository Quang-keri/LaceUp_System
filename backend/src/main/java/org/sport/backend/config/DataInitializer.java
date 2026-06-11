package org.sport.backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.sport.backend.constant.*;
import org.sport.backend.dto.request.city.CityRequest;
import org.sport.backend.dto.request.ward.WardRequest;
import org.sport.backend.entity.*;
import org.sport.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final CityRepository cityRepository;
    private final CategoryRepository categoryRepository;
    private final AmenityRepository amenityRepository;
    private final CourtRepository courtRepository;
    private final CourtPriceRepository courtPriceRepository;
    private final RentalAreaRepository rentalAreaRepository;
    private final CourtCopyRepository courtCopyRepository;
    private final PostRepository postRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserCategoryRankRepository userCategoryRankRepository;
    private final PasswordEncoder passwordEncoder;
    private final ItemGroupRepository itemGroupRepository;
    private final ObjectMapper objectMapper;
    private final WardRepository wardRepository;
    private final NewsRepository newsRepository;
    private final ReviewRepository reviewRepository;
    private final BankAccountRepository bankAccountRepository;

    @Override
    @Transactional
    public void run(String @NonNull ... args) {

        List<String> courtImagesList = List.of(
                "https://babolat.com.vn/wp-content/uploads/2023/10/san-cau-long-viettel.jpg",
                "https://babolat.com.vn/wp-content/uploads/2023/10/san-cau-long-viettel-hoang-hoa-tham.jpg",
                "https://cdn.shopvnb.com/uploads/images/tin_tuc/review-san-cau-long-quan-12-san-cau-long-nhat-pham-1.webp",
                "https://cdn.shopvnb.com/uploads/images/tin_tuc/review-san-cau-long-quan-12-san-cau-long-nhat-pham-2.webp"
        );

        if (permissionRepository.count() == 0) seedPermissions();

        Map<String, Permission> permMap = permissionRepository.findAll().stream()
                .collect(Collectors.toMap(Permission::getPermissionName, p -> p));

        if (roleRepository.count() == 0) seedRoles(permMap);
        ensureDeletedRole();

        Role adminRole = roleRepository.findByRoleName("ADMIN").orElse(null);
        Role ownerRole = roleRepository.findByRoleName("OWNER").orElse(null);
        Role renterRole = roleRepository.findByRoleName("RENTER").orElse(null);

        if (adminRole == null || ownerRole == null || renterRole == null) return;

        if (cityRepository.count() == 0) {
            initAddressData();
        }
        if (categoryRepository.count() == 0) seedCategories();
        if (amenityRepository.count() == 0) seedAmenities();

        if (userRepository.count() == 0) {
            String commonPass = passwordEncoder.encode("123456");
            List<User> users = new ArrayList<>();

            users.add(User.builder().userName("Admin main").email("admin@gmail.com").passwordHash(commonPass).gender("Male").phone("0901000011").dateOfBirth(LocalDate.of(1990, 5, 15)).provider(AuthProvider.LOCAL).role(adminRole).createdAt(LocalDateTime.now().minusYears(5)).active(true)
                    .creditScore(100).memberTier(MemberTier.BRONZE).totalMatches(0).totalSpent(BigDecimal.ZERO).build());
            users.add(User.builder().userName("Dương Xuân Sơn").email("owner@gmail.com").passwordHash(commonPass).gender("Male").phone("0911000011").dateOfBirth(LocalDate.of(1985, 8, 20)).provider(AuthProvider.LOCAL).role(ownerRole).createdAt(LocalDateTime.now().minusYears(1)).active(true)
                    .creditScore(100).memberTier(MemberTier.BRONZE).totalMatches(0).totalSpent(BigDecimal.ZERO).build());
            users.add(User.builder().userName("Ngô Anh Kiệt").email("kietnass181060@fpt.edu.vn").passwordHash(commonPass).gender("Male").phone("0931000011").dateOfBirth(LocalDate.of(2000, 1, 10)).provider(AuthProvider.LOCAL).role(renterRole).createdAt(LocalDateTime.now().minusYears(1)).active(true)
                    .creditScore(100).memberTier(MemberTier.BRONZE).totalMatches(0).totalSpent(BigDecimal.ZERO).build());

            for (int i = 1; i <= 4; i++)
                users.add(createDummyUser("Renter " + i, "renter" + i + "@gmail.com", commonPass, renterRole));
            users.add(createDummyUser("Owner1", "owner1@gmail.com", commonPass, ownerRole));
            users.add(createDummyUser("Admin1", "admin1@gmail.com", commonPass, adminRole));
            users = userRepository.saveAll(users);

        }

        seedBankAccountsAndDeletionTestUsers(ownerRole, renterRole);

        if (courtRepository.count() == 0) seedCourtData(courtImagesList.subList(0, 2));

        seedAdditionalOwnersAndRentalAreas(ownerRole);

        seedPostsForAllRentalAreas();
        if (itemGroupRepository.count() == 0) {
            seedItemGroup();
        }
        if (newsRepository.count() == 0) {
            seedNews();
        }

        if (reviewRepository.count() == 0) {
            seedReviews();
        }

    }

    private void ensureDeletedRole() {
        if (roleRepository.findByRoleName("DELETED").isPresent()) {
            return;
        }

        Role deletedRole = Role.builder()
                .roleName("DELETED")
                .description("Tài khoản đã được xóa và ẩn danh")
                .active(false)
                .permissions(new HashSet<>())
                .build();

        roleRepository.save(deletedRole);
    }

    private void seedBankAccountsAndDeletionTestUsers(
            Role ownerRole,
            Role renterRole
    ) {
        String commonPass = passwordEncoder.encode("123456");

        User sonOwner = userRepository.findByEmail("owner@gmail.com")
                .orElseGet(() -> userRepository.save(
                        buildSeedUser(
                                "Dương Xuân Sơn",
                                "owner@gmail.com",
                                "0911000011",
                                commonPass,
                                ownerRole
                        )
                ));

        sonOwner.setUserName("Dương Xuân Sơn");
        sonOwner.setRole(ownerRole);
        sonOwner.setActive(true);
        userRepository.save(sonOwner);

        User kietRenter = userRepository.findByEmail("kietnass181060@fpt.edu.vn")
                .orElseGet(() -> userRepository.save(
                        buildSeedUser(
                                "Ngô Anh Kiệt",
                                "kietnass181060@fpt.edu.vn",
                                "0931000011",
                                commonPass,
                                renterRole
                        )
                ));

        kietRenter.setUserName("Ngô Anh Kiệt");
        kietRenter.setRole(renterRole);
        kietRenter.setActive(true);
        userRepository.save(kietRenter);

        ensureBankAccount(
                sonOwner,
                "TPBank",
                "07711338101",
                "DUONG XUAN SON",
                "970423"
        );

        ensureBankAccount(
                kietRenter,
                "MB Bank",
                "0933484531",
                "NGO ANH KIET",
                "970422"
        );

        ensureDeletionTestUser(
                "Tester 1",
                "tester1app@gmail.com",
                "0909000001",
                commonPass,
                renterRole
        );

        ensureDeletionTestUser(
                "Tester 2 web",
                "tester2web@gmail.com",
                "0909000002",
                commonPass,
                renterRole
        );

        ensureDeletionTestUser(
                "Tester 3 owner",
                "se184616phamdangquang@gmail.com",
                "0909000003",
                commonPass,
                ownerRole
        );
    }

    private void ensureDeletionTestUser(
            String userName,
            String email,
            String phone,
            String encodedPassword,
            Role role
    ) {
        if (userRepository.existsByEmail(email)) {
            return;
        }

        userRepository.save(
                buildSeedUser(
                        userName,
                        email,
                        phone,
                        encodedPassword,
                        role
                )
        );
    }

    private User buildSeedUser(
            String userName,
            String email,
            String phone,
            String encodedPassword,
            Role role
    ) {
        return User.builder()
                .userName(userName)
                .email(email)
                .passwordHash(encodedPassword)
                .gender("Male")
                .phone(phone)
                .dateOfBirth(LocalDate.of(2000, 1, 1))
                .provider(AuthProvider.LOCAL)
                .role(role)
                .active(true)
                .createdAt(LocalDateTime.now())
                .creditScore(100)
                .memberTier(MemberTier.BRONZE)
                .totalMatches(0)
                .totalSpent(BigDecimal.ZERO)
                .accountDeletionStatus(AccountDeletionStatus.NONE)
                .build();
    }

    private void ensureBankAccount(
            User user,
            String bankName,
            String accountNumber,
            String accountHolderName,
            String bankBin
    ) {
        Optional<BankAccount> existingAccount = bankAccountRepository
                .findAll()
                .stream()
                .filter(account ->
                        account.getUser() != null
                                && Objects.equals(
                                account.getUser().getUserId(),
                                user.getUserId()
                        )
                )
                .findFirst();

        BankAccount bankAccount = existingAccount.orElseGet(
                () -> BankAccount.builder()
                        .user(user)
                        .build()
        );

        bankAccount.setUser(user);
        bankAccount.setBankName(bankName);
        bankAccount.setAccountNumber(accountNumber);
        bankAccount.setAccountHolderName(accountHolderName);
        bankAccount.setBankBin(bankBin);
        bankAccount.setIsVerified(true);
        bankAccount.setVerificationCode(null);
        bankAccount.setBranchName(null);
        bankAccount.setQrCode(null);

        BankAccount savedBankAccount =
                bankAccountRepository.save(bankAccount);

        user.setBankAccount(savedBankAccount);
        userRepository.save(user);
    }


    private void seedAdditionalOwnersAndRentalAreas(Role ownerRole) {
        String encodedPassword = passwordEncoder.encode("123456");

        User hanOwner = ensureSeedOwner(
                "Nguyễn Hồng Vũ Hân",
                "moon060404@gmail.com",
                "0909000101",
                encodedPassword,
                ownerRole
        );
        ensureBankAccount(
                hanOwner,
                "Vietcombank",
                "9945356477",
                "NGUYEN HONG VU HAN",
                "970436"
        );

        User nhuYOwner = ensureSeedOwner(
                "Trần Vũ Như Ý",
                "tranvunhuy20112020@gmail.com",
                "0909000102",
                encodedPassword,
                ownerRole
        );
        ensureBankAccount(
                nhuYOwner,
                "VPBank",
                "0342836060",
                "TRAN VU NHU Y",
                "970432"
        );

        City hoChiMinhCity = findHoChiMinhCity();

        ensureRentalAreaWithFourCourts(
                hanOwner,
                hoChiMinhCity,
                "Sân Bóng Đá Hân Sport - Bình Thạnh",
                "25 Nguyễn Xí",
                "Phường 26",
                10.8137,
                106.7074,
                "Sân bóng đá",
                "Cỏ nhân tạo",
                false,
                "HAN-FB",
                List.of(
                        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=80"
                ),
                new int[][]{
                        {5, 12, 80000, 120000},
                        {12, 18, 120000, 160000},
                        {18, 22, 180000, 220000}
                }
        );

        ensureRentalAreaWithFourCourts(
                nhuYOwner,
                hoChiMinhCity,
                "Sân Cầu Lông Như Ý - Thủ Đức",
                "88 Võ Văn Ngân",
                "Phường Linh Chiểu",
                10.8506,
                106.7719,
                "Sân cầu lông",
                "Thảm PVC",
                true,
                "NHUY-BD",
                List.of(
                        "https://babolat.com.vn/wp-content/uploads/2023/10/san-cau-long-viettel.jpg",
                        "https://cdn.shopvnb.com/uploads/images/tin_tuc/review-san-cau-long-quan-12-san-cau-long-nhat-pham-1.webp"
                ),
                new int[][]{
                        {5, 12, 80000, 100000},
                        {12, 18, 90000, 120000},
                        {18, 22, 120000, 150000}
                }
        );
    }

    private User ensureSeedOwner(
            String userName,
            String email,
            String phone,
            String encodedPassword,
            Role ownerRole
    ) {
        User owner = userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(
                        buildSeedUser(
                                userName,
                                email,
                                phone,
                                encodedPassword,
                                ownerRole
                        )
                ));

        // Chỉ chuẩn hóa tài khoản seed này, không tác động các user cũ khác.
        owner.setUserName(userName);
        owner.setPhone(phone);
        owner.setGender("Female");
        owner.setRole(ownerRole);
        owner.setActive(true);
        return userRepository.save(owner);
    }

    private City findHoChiMinhCity() {
        return cityRepository.findAll().stream()
                .filter(city -> Objects.equals(city.getProvinceCode(), 79)
                        || normalizeVietnamese(city.getCityName()).contains("ho chi minh"))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Không tìm thấy Thành phố Hồ Chí Minh trong bảng city"
                ));
    }

    private String normalizeVietnamese(String value) {
        if (value == null) return "";

        String normalized = java.text.Normalizer.normalize(
                value,
                java.text.Normalizer.Form.NFD
        );

        return normalized
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT);
    }

    private void ensureRentalAreaWithFourCourts(
            User owner,
            City city,
            String rentalAreaName,
            String street,
            String ward,
            double latitude,
            double longitude,
            String categoryName,
            String surfaceType,
            boolean indoor,
            String courtCodePrefix,
            List<String> imageUrls,
            int[][] priceRanges
    ) {
        boolean alreadyExists = rentalAreaRepository.findAll().stream()
                .anyMatch(area -> rentalAreaName.equalsIgnoreCase(area.getRentalAreaName()));

        if (alreadyExists) {
            return;
        }

        Category category = categoryRepository.findAll().stream()
                .filter(item -> categoryName.equalsIgnoreCase(item.getCategoryName()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Không tìm thấy category: " + categoryName
                ));

        RentalArea area = RentalArea.builder()
                .rentalAreaName(rentalAreaName)
                .address(Address.builder()
                        .street(street)
                        .ward(ward)
                        .city(city)
                        .cityName(city.getCityName())
                        .build())
                .owner(owner)
                .openTime(LocalTime.of(5, 0))
                .closeTime(LocalTime.of(22, 0))
                .contactName(owner.getUserName())
                .contactPhone(owner.getPhone())
                .gmail(owner.getEmail())
                .isActive(true)
                .status(RentalAreaStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .createdAt(LocalDateTime.now())
                .latitude(latitude)
                .longitude(longitude)
                .rating(5.0)
                .build();

        rentalAreaRepository.save(area);

        for (int index = 1; index <= 4; index++) {
            Court court = Court.builder()
                    .courtName(categoryName + " 0" + index)
                    .surfaceType(surfaceType)
                    .courtStatus(CourtStatus.ACTIVE)
                    .indoor(indoor)
                    .rentalArea(area)
                    .category(category)
                    .images(new ArrayList<>())
                    .build();

            String imageUrl = imageUrls.get((index - 1) % imageUrls.size());
            CourtImage image = CourtImage.builder()
                    .imageUrl(imageUrl)
                    .publicId("seed-" + courtCodePrefix.toLowerCase(Locale.ROOT)
                            + "-" + index)
                    .court(court)
                    .isCover(true)
                    .build();
            court.getImages().add(image);

            courtRepository.save(court);

            courtCopyRepository.save(
                    CourtCopy.builder()
                            .court(court)
                            .courtCode(courtCodePrefix + "-0" + index)
                            .courtCopyStatus(CourtCopyStatus.ACTIVE)
                            .build()
            );

            List<CourtPrice> prices = new ArrayList<>();
            for (int[] range : priceRanges) {
                int startHour = range[0];
                int endHour = range[1];
                int weekdayPrice = range[2];
                int weekendPrice = range[3];

                prices.add(createPrice(
                        court,
                        startHour,
                        endHour,
                        null,
                        null,
                        weekdayPrice,
                        DayType.WEEKDAY,
                        PriceType.NORMAL,
                        1
                ));

                prices.add(createPrice(
                        court,
                        startHour,
                        endHour,
                        null,
                        null,
                        weekendPrice,
                        DayType.WEEKEND,
                        PriceType.NORMAL,
                        1
                ));
            }

            courtPriceRepository.saveAll(prices);
        }
    }

    private void seedReviews() {
        List<RentalArea> rentalAreas = rentalAreaRepository.findAll();
        if (rentalAreas.isEmpty()) return;

        RentalArea area = rentalAreas.getFirst();

        User renterMain = userRepository.findByEmail("renter@gmail.com").orElse(null);
        User renter1 = userRepository.findByEmail("renter1@gmail.com").orElse(null);
        User renter2 = userRepository.findByEmail("renter2@gmail.com").orElse(null);
        User renter3 = userRepository.findByEmail("renter3@gmail.com").orElse(null);

        List<Review> reviews = new ArrayList<>();

        if (renterMain != null) {
            reviews.add(Review.builder()
                    .user(renterMain)
                    .rentalArea(area)
                    .rating(5)
                    .comment("Sân rất đẹp, mặt thảm bám tốt. Chủ sân cũng rất nhiệt tình. Sẽ quay lại ủng hộ!")
                    .build());
        }
        if (renter1 != null) {
            reviews.add(Review.builder()
                    .user(renter1)
                    .rentalArea(area)
                    .rating(4)
                    .comment("Sân tốt, ánh sáng ok nhưng chỗ để xe hơi chật vào buổi tối.")
                    .build());
        }
        if (renter2 != null) {
            reviews.add(Review.builder()
                    .user(renter2)
                    .rentalArea(area)
                    .rating(5)
                    .comment("Giá cả hợp lý, tiện ích đầy đủ, wifi mạnh.")
                    .build());
        }
        if (renter3 != null) {
            reviews.add(Review.builder()
                    .user(renter3)
                    .rentalArea(area)
                    .rating(3)
                    .comment("Thảm sân số 2 hơi trơn một chút, mong chủ sân bảo trì thêm.")
                    .build());
        }

        if (!reviews.isEmpty()) {
            reviewRepository.saveAll(reviews);

            // Tính trung bình Rating và lưu lại vào RentalArea
            double averageRating = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);

            // Làm tròn đến 1 chữ số thập phân
            area.setRating(Math.round(averageRating * 10.0) / 10.0);
            rentalAreaRepository.save(area);
        }
    }

    private void seedNews() {
        User user = userRepository.findByEmail("admin@gmail.com").orElseThrow(null);
        ;
        News news = News.builder()
                .title("Phát thành web booking cho hệ thống LaceUp")
                .content("Website của hệ thống LaceUp đươc phát thành , nền tảng của ra mắt các chức năng đặt lịch ,quản lí lịch , quản lí sân , quản lí người dùng , quản lí tài chính và nhiều chức năng khác nhằm mang lại trải nghiệm tốt nhất cho khách hàng và chủ sân .")
                .createdAt(LocalDateTime.now())
                .createdBy(user)
                .visibility(NewsVisibility.PUBLIC)
                .build();
        newsRepository.save(news);
    }

    private void seedItemGroup() {
        ItemGroup group1 = new ItemGroup();
        group1.setName("Đồ ăn / Thức uống");

        ItemGroup group2 = new ItemGroup();
        group2.setName("Thiết bị thuê (Vợt, Bóng...)");

        ItemGroup group3 = new ItemGroup();
        group3.setName("Dịch vụ khác (Trọng tài, Nhặt bóng...)");

        itemGroupRepository.save(group1);
        itemGroupRepository.save(group2);
        itemGroupRepository.save(group3);
    }

    private void seedPermissions() {
        List<Permission> permissions = List.of(
                Permission.builder().permissionName("VIEW_USERS").description("Xem danh sách người dùng").build(),
                Permission.builder().permissionName("VIEW_USER_DETAIL").description("Xem chi tiết một người dùng").build(),
                Permission.builder().permissionName("CREATE_USER").description("Tạo tài khoản người dùng mới").build(),
                Permission.builder().permissionName("UPDATE_USER").description("Cập nhật thông tin người dùng").build(),
                Permission.builder().permissionName("UPDATE_USER_STATUS").description("Cập nhật trạng thái người dùng (Khóa/Mở)").build(),

                Permission.builder().permissionName("UPDATE_CUSTOMER_REPUTTION").description("Cộng hoặc trừ điểm uy tín của người dùng").build(),
                Permission.builder().permissionName("VIEW_CUSTOMER").description("Xem danh sách khách hàng đã từng đặt sân tại cơ sở").build(),
                Permission.builder().permissionName("VIEW_CUSTOMER_DETAIL").description("Xem chi tiết khách hàng đ0ã từng đặt sân tại cơ sở").build(),

                Permission.builder().permissionName("ASSIGN_ROLE").description("Gán vai trò (Role) cho người dùng").build(),
                Permission.builder().permissionName("VIEW_USER_AUTHORITIES").description("Xem danh sách quyền của người dùng").build(),
                Permission.builder().permissionName("VIEW_ROLES").description("Xem danh sách và chi tiết vai trò").build(),
                Permission.builder().permissionName("CREATE_ROLE").description("Tạo mới vai trò").build(),
                Permission.builder().permissionName("UPDATE_ROLE").description("Cập nhật thông tin và trạng thái vai trò").build(),
                Permission.builder().permissionName("MANAGE_ROLE_PERMISSIONS").description("Thêm hoặc xóa quyền của vai trò").build(),

                Permission.builder().permissionName("VIEW_COURTS").description("Xem danh sách sân trong khu vực").build(),
                Permission.builder().permissionName("EXTEND_SLOT").description("Gia hạn thời gian thuê sân").build(),
                Permission.builder().permissionName("SWAP_SLOT").description("Đổi sân hoặc đổi giờ thuê").build(),

                Permission.builder().permissionName("VIEW_DASHBOARD_ADMIN").description("Xem bảng admin").build(),
                Permission.builder().permissionName("VIEW_DASHBOARD_OWNER").description("Xem bảng owner").build(),

                Permission.builder().permissionName("CREATE_RENTAL_AREA").description("Tạo mới khu vực cho thuê (Cơ sở)").build(),
                Permission.builder().permissionName("UPDATE_RENTAL_AREA").description("Cập nhật thông tin khu vực cho thuê").build(),
                Permission.builder().permissionName("DELETE_RENTAL_AREA").description("Xóa/Vô hiệu hóa khu vực cho thuê").build(),
                Permission.builder().permissionName("VIEW_RENTAL_AREA").description("Xem thông tin khu vực cho thuê").build(),

                Permission.builder().permissionName("CREATE_POST").description("Tạo bài đăng mới").build(),
                Permission.builder().permissionName("UPDATE_POST").description("Cập nhật bài đăng của mình").build(),
                Permission.builder().permissionName("DELETE_POST").description("Xóa bài đăng của mình").build(),

                Permission.builder().permissionName("VIEW_PERMISSIONS").description("Xem danh sách và chi tiết các quyền").build(),
                Permission.builder().permissionName("CREATE_PERMISSION").description("Tạo quyền hệ thống mới").build(),
                Permission.builder().permissionName("UPDATE_PERMISSION").description("Cập nhật thông tin quyền hệ thống").build(),
                Permission.builder().permissionName("DELETE_PERMISSION").description("Xóa quyền khỏi hệ thống").build(),
                Permission.builder().permissionName("GRANT_EXTRA_PERMISSION").description("Thêm quyền truy cập riêng cho một người dùng").build(),
                Permission.builder().permissionName("REVOKE_EXTRA_PERMISSION").description("Thu hồi quyền truy cập riêng của một người dùng").build(),

                Permission.builder().permissionName("CREATE_PAYMENT").description("Thực hiện thanh toán").build(),

                Permission.builder().permissionName("CREATE_NEWS").description("Đăng tin tức/thông báo mới").build(),
                Permission.builder().permissionName("UPDATE_NEWS").description("Cập nhật tin tức").build(),
                Permission.builder().permissionName("DELETE_NEWS").description("Xóa tin tức").build(),

                Permission.builder().permissionName("SUBMIT_MATCH_RESULT").description("Gửi kết quả trận đấu").build(),
                Permission.builder().permissionName("RESPOND_MATCH_RESULT").description("Xác nhận hoặc từ chối kết quả trận đấu").build(),
                Permission.builder().permissionName("CREATE_MATCH").description("Tạo trận đấu (giao lưu/cố định)").build(),
                Permission.builder().permissionName("JOIN_MATCH").description("Tham gia trận đấu đã tạo").build(),
                Permission.builder().permissionName("VIEW_ALL_MATCHES").description("Xem toàn bộ danh sách trận đấu trên hệ thống").build(),
                Permission.builder().permissionName("VIEW_OWNER_MATCHES").description("Xem danh sách trận đấu diễn ra tại sân của mình").build(),

                Permission.builder().permissionName("CREATE_COURT_PRICE").description("Tạo cấu hình giá thuê sân").build(),
                Permission.builder().permissionName("UPDATE_COURT_PRICE").description("Cập nhật giá thuê sân").build(),
                Permission.builder().permissionName("DELETE_COURT_PRICE").description("Xóa cấu hình giá thuê sân").build(),
                Permission.builder().permissionName("CREATE_COURT_COPY").description("Thêm mới sân vật lý vào cơ sở").build(),
                Permission.builder().permissionName("UPDATE_COURT_COPY").description("Cập nhật thông tin/trạng thái sân vật lý").build(),
                Permission.builder().permissionName("CREATE_COURT").description("Tạo mới loại sân trong khu vực").build(),
                Permission.builder().permissionName("UPDATE_COURT").description("Cập nhật thông tin loại sân").build(),
                Permission.builder().permissionName("DELETE_COURT").description("Xóa loại sân").build(),

                Permission.builder().permissionName("USE_CHAT").description("Sử dụng tính năng nhắn tin nội bộ").build(),

                Permission.builder().permissionName("CREATE_CATEGORY").description("Tạo danh mục môn thể thao mới").build(),
                Permission.builder().permissionName("UPDATE_CATEGORY").description("Cập nhật danh mục thể thao").build(),
                Permission.builder().permissionName("DELETE_CATEGORY").description("Xóa danh mục thể thao").build(),

                Permission.builder().permissionName("BOOK_ROOM").description("Thực hiện đặt sân và tạo giao dịch").build(),
                Permission.builder().permissionName("VIEW_BOOKINGS").description("Xem danh sách chi tiết các đơn đặt sân").build(),
                Permission.builder().permissionName("MANAGE_BOOKING").description("Cập nhật trạng thái/thông tin đơn đặt sân").build(),

                Permission.builder().permissionName("MANAGE_FINANCE").description("Quản lý tài chính, xác nhận thu tiền khách").build(),

                Permission.builder().permissionName("CREATE_AMENITY").description("Tạo mới tiện ích hệ thống").build(),
                Permission.builder().permissionName("UPDATE_AMENITY").description("Cập nhật tiện ích hệ thống").build(),
                Permission.builder().permissionName("DELETE_AMENITY").description("Xóa tiện ích hệ thống").build(),

                Permission.builder().permissionName("MANAGE_PAYOUT").description("Xác nhận chuyển tiền/thanh toán cho chủ sân").build(),
                Permission.builder().permissionName("VIEW_PAYOUT").description("Xem lịch sử nhận tiền của cơ sở").build(),

                Permission.builder().permissionName("MANAGE_TRANSACTION").description("Quản lý giao dịch").build(),

                Permission.builder().permissionName("MANAGE_COMMISSION").description("Thiết lập và quản lý cấu hình hoa hồng").build(),
                Permission.builder().permissionName("VIEW_COMMISSION").description("Xem bảng cấu hình phần trăm hoa hồng").build(),
                Permission.builder().permissionName("VIEW_REPORT").description("Xem bảng báo cáo").build()
        );
        permissionRepository.saveAll(permissions);
    }

    private void seedRoles(Map<String, Permission> permMap) {
        Role adminRole = Role.builder()
                .roleName("ADMIN")
                .description("Quản trị hệ thống")
                .active(true)
                .permissions(new HashSet<>(permMap.values()))
                .build();

        Set<Permission> ownerPerms = getPermissions(permMap,
                "VIEW_DASHBOARD_OWNER", "CREATE_RENTAL_AREA", "UPDATE_RENTAL_AREA",
                "DELETE_RENTAL_AREA", "CREATE_COURT", "UPDATE_COURT", "DELETE_COURT",
                "CREATE_COURT_COPY", "UPDATE_COURT_COPY", "CREATE_COURT_PRICE",
                "UPDATE_COURT_PRICE", "DELETE_COURT_PRICE", "VIEW_BOOKINGS",
                "MANAGE_BOOKING", "MANAGE_FINANCE", "VIEW_PAYOUT", "VIEW_COMMISSION",
                "USE_CHAT", "CREATE_POST", "UPDATE_POST", "DELETE_POST", "VIEW_OWNER_MATCHES",
                "VIEW_CUSTOMER", "UPDATE_CUSTOMER_REPUTTION", "VIEW_CUSTOMER_DETAIL"
        );
        Role ownerRole = Role.builder()
                .roleName("OWNER")
                .description("Chủ sân")
                .active(true)
                .permissions(ownerPerms)
                .build();

        Set<Permission> renterPerms = getPermissions(permMap,
                "BOOK_ROOM", "CREATE_PAYMENT", "USE_CHAT", "EXTEND_SLOT",
                "SWAP_SLOT", "CREATE_MATCH", "JOIN_MATCH",
                "SUBMIT_MATCH_RESULT", "RESPOND_MATCH_RESULT", "CREATE_POST",
                "UPDATE_POST", "DELETE_POST", "VIEW_COURTS", "MANAGE_TRANSACTION"
        );
        Role renterRole = Role.builder()
                .roleName("RENTER")
                .description("Người thuê")
                .active(true)
                .permissions(renterPerms)
                .build();

        roleRepository.saveAll(List.of(adminRole, ownerRole, renterRole));
    }

    private Set<Permission> getPermissions(Map<String, Permission> permMap, String... names) {
        return Arrays.stream(names).map(permMap::get).filter(Objects::nonNull).collect(Collectors.toSet());
    }

    private User createDummyUser(String name, String email, String pass, Role role) {
        Random rand = new Random();
        return User.builder()
                .userName(name).email(email).passwordHash(pass).gender(rand.nextBoolean() ? "Male" : "Female")
                .phone("09" + (10000000 + rand.nextInt(90000000)))
                .dateOfBirth(LocalDate.of(1980 + rand.nextInt(25), 1 + rand.nextInt(12), 1 + rand.nextInt(28)))
                .provider(AuthProvider.LOCAL).role(role).active(true).createdAt(LocalDateTime.now().minusDays(rand.nextInt(365)))
                .creditScore(100).memberTier(MemberTier.BRONZE).totalMatches(0).totalSpent(BigDecimal.ZERO)
                .build();
    }

    private void seedCourtData(List<String> images) {
        User owner = userRepository.findByEmail("owner@gmail.com").orElseThrow();
        List<City> cities = cityRepository.findAll();
        if (cities.isEmpty()) {
            initAddressData();
            cities = cityRepository.findAll();
        }
        if (cities.isEmpty()) {
            throw new IllegalStateException("Cannot seed courts: no cities found after initAddressData()");
        }
        City city = cities.get(27);

        Category category = categoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Sân cầu lông"))
                .findFirst().orElseThrow();

        RentalArea area = RentalArea.builder()
                .rentalAreaName("Hệ thống Sân Cầu Lông Pro - Quận 9")
                .address(Address.builder().street("456 Lê Văn Việt").ward("Phường Thủ Dầu Một").city(city).cityName(city.getCityName()).build())
                .owner(owner)
                .openTime(LocalTime.of(5, 0))
                .closeTime(LocalTime.of(22, 0))
                .contactName(owner.getUserName())
                .contactPhone(owner.getPhone())
                .gmail(owner.getEmail())
                .isActive(true)
                .status(RentalAreaStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .createdAt(LocalDateTime.now().minusMonths(2))
                .latitude(10.80155)
                .longitude(106.65421)
                .build();
        rentalAreaRepository.save(area);

        int imgIndex = 0;
        for (int i = 1; i <= 2; i++) {
            Court court = Court.builder()
                    .courtName("Sân Standard 0" + i)
                    .surfaceType("Thảm PVC")
                    .courtStatus(CourtStatus.ACTIVE)
                    .indoor(true)
                    .rentalArea(area)
                    .category(category)
                    .images(new ArrayList<>())
                    .build();

            CourtImage img = CourtImage.builder()
                    .imageUrl(images.get(imgIndex++))
                    .publicId("dummy-public-id-" + UUID.randomUUID().toString().substring(0, 8))
                    .court(court)
                    .isCover(true)
                    .build();
            court.getImages().add(img);

            courtRepository.save(court);

            courtCopyRepository.save(CourtCopy.builder()
                    .court(court).courtCode("STD-0" + i).courtCopyStatus(CourtCopyStatus.ACTIVE).build());

            LocalDate eventStart = LocalDate.of(2026, 6, 1);
            LocalDate eventEnd = LocalDate.of(2026, 6, 15);

            List<CourtPrice> prices = new ArrayList<>();

            prices.add(createPrice(court, 5, 12, eventStart, eventEnd, 170000, DayType.WEEKDAY, PriceType.EVENT, 2));
            prices.add(createPrice(court, 12, 18, eventStart, eventEnd, 160000, DayType.WEEKDAY, PriceType.EVENT, 2));
            prices.add(createPrice(court, 18, 22, eventStart, eventEnd, 180000, DayType.WEEKDAY, PriceType.EVENT, 2));

            prices.add(createPrice(court, 5, 12, eventStart, eventEnd, 190000, DayType.WEEKEND, PriceType.EVENT, 2));
            prices.add(createPrice(court, 12, 18, eventStart, eventEnd, 180000, DayType.WEEKEND, PriceType.EVENT, 2));
            prices.add(createPrice(court, 18, 22, eventStart, eventEnd, 200000, DayType.WEEKEND, PriceType.EVENT, 2));

            prices.add(createPrice(court, 5, 12, null, null, 90000, DayType.WEEKDAY, PriceType.NORMAL, 1));
            prices.add(createPrice(court, 12, 18, null, null, 80000, DayType.WEEKDAY, PriceType.NORMAL, 1));
            prices.add(createPrice(court, 18, 22, null, null, 100000, DayType.WEEKDAY, PriceType.NORMAL, 1));

            prices.add(createPrice(court, 5, 12, null, null, 110000, DayType.WEEKEND, PriceType.NORMAL, 1));
            prices.add(createPrice(court, 12, 18, null, null, 100000, DayType.WEEKEND, PriceType.NORMAL, 1));
            prices.add(createPrice(court, 18, 22, null, null, 120000, DayType.WEEKEND, PriceType.NORMAL, 1));

            courtPriceRepository.saveAll(prices);
        }
    }

    private void seedCategories() {
        List.of("Sân cầu lông", "Sân bóng đá", "Sân pickleball").forEach(name -> {
            if (!categoryRepository.existsByCategoryName(name))
                categoryRepository.save(Category.builder().categoryName(name).build());
        });
    }

    private void seedAmenities() {
        List.of(Amenity.builder().amenityName("Wifi tốc độ cao").iconKey("FaWifi").build(), Amenity.builder().amenityName("Ổ điện").iconKey("FaPlug").build())
                .forEach(a -> {
                    if (!amenityRepository.existsByAmenityName(a.getAmenityName())) amenityRepository.save(a);
                });
    }

    public void initAddressData() {
        try {
            InputStream cityStream = new ClassPathResource("data/cities.json").getInputStream();
            InputStream wardStream = new ClassPathResource("data/wards.json").getInputStream();

            List<CityRequest> cityDtos = objectMapper.readValue(cityStream, new TypeReference<List<CityRequest>>() {
            });
            List<WardRequest> wardDtos = objectMapper.readValue(wardStream, new TypeReference<List<WardRequest>>() {
            });

            List<City> citiesToSave = cityDtos.stream()
                    .map(dto -> City.builder()
                            .cityName(dto.getName())
                            .provinceCode(dto.getCode())
                            .build())
                    .collect(Collectors.toList());

            List<City> savedCities = cityRepository.saveAll(citiesToSave);

            Map<Integer, City> cityMap = savedCities.stream()
                    .collect(Collectors.toMap(City::getProvinceCode, city -> city));

            List<Ward> wardsToSave = new ArrayList<>();
            for (WardRequest dto : wardDtos) {
                City city = cityMap.get(dto.getProvince_code());
                if (city != null) {
                    Ward ward = Ward.builder()
                            .wardName(dto.getName())
                            .wardCode(dto.getCode())
                            .city(city)
                            .build();
                    wardsToSave.add(ward);
                }
            }

            wardRepository.saveAll(wardsToSave);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Đảm bảo mỗi RentalArea có đúng một bài đăng PUBLISHED để hiển thị cho renter.
     * Hàm idempotent: chạy lại ứng dụng chỉ bổ sung post còn thiếu, không tạo trùng.
     */
    private void seedPostsForAllRentalAreas() {
        List<Post> existingPosts = postRepository.findAll();

        for (RentalArea area : rentalAreaRepository.findAll()) {
            if (area.getOwner() == null) {
                continue;
            }

            boolean postAlreadyExists = existingPosts.stream()
                    .anyMatch(post -> post.getRentalArea() != null
                            && Objects.equals(
                            post.getRentalArea().getRentalAreaId(),
                            area.getRentalAreaId()
                    ));

            if (postAlreadyExists) {
                continue;
            }

            List<Court> courts = courtRepository.findAllByRentalArea(area);
            if (courts.isEmpty()) {
                continue;
            }

            Court representativeCourt = courts.getFirst();

            Post post = Post.builder()
                    .title(area.getRentalAreaName())
                    .description(buildRentalAreaPostDescription(area, courts))
                    .postStatus(PostStatus.PUBLISHED)
                    .user(area.getOwner())
                    .court(representativeCourt)
                    .rentalArea(area)
                    .build();

            Post savedPost = postRepository.save(post);
            existingPosts.add(savedPost);
        }
    }

    private String buildRentalAreaPostDescription(
            RentalArea area,
            List<Court> courts
    ) {
        String categoryName = courts.stream()
                .map(Court::getCategory)
                .filter(Objects::nonNull)
                .map(Category::getCategoryName)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse("Sân thể thao");

        return String.format(
                "%s có %d sân, hoạt động từ %s đến %s. "
                        + "Sân bãi tiêu chuẩn, đầy đủ tiện nghi và đã mở lịch đặt sân.",
                categoryName,
                courts.size(),
                area.getOpenTime(),
                area.getCloseTime()
        );
    }

    private CourtPrice createPrice(Court court, int startHour, int endHour,
                                   LocalDate startDate, LocalDate endDate,
                                   int price, DayType dayType, PriceType priceType, int priority) {
        return CourtPrice.builder()
                .court(court)
                .startTime(LocalTime.of(startHour, 0))
                .endTime(LocalTime.of(endHour, 0))
                .startDate(startDate)
                .endDate(endDate)
                .pricePerHour(BigDecimal.valueOf(price))
                .dayType(dayType)
                .priceType(priceType)
                .priority(priority)
                .build();
    }

}
