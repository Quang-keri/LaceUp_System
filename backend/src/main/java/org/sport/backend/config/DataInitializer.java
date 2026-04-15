package org.sport.backend.config;

import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.sport.backend.constant.*;
import org.sport.backend.entity.*;
import org.sport.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final SlotRepository slotRepository;
    private final PostRepository postRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserCategoryRankRepository userCategoryRankRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String @NonNull ... args) {

        List<String> courtImagesList = List.of(
                "https://babolat.com.vn/wp-content/uploads/2023/10/san-cau-long-viettel.jpg",
                "https://babolat.com.vn/wp-content/uploads/2023/10/san-cau-long-viettel-hoang-hoa-tham.jpg",
                "https://cdn.shopvnb.com/uploads/images/tin_tuc/review-san-cau-long-quan-12-san-cau-long-nhat-pham-1.webp",
                "https://cdn.shopvnb.com/uploads/images/tin_tuc/review-san-cau-long-quan-12-san-cau-long-nhat-pham-2.webp",
                "https://cdn.shopvnb.com/uploads/images/tin_tuc/review-san-cau-long-quan-12-san-cau-long-nhat-pham-4.webp",
                "https://cdn.shopvnb.com/uploads/images/tin_tuc/tong-hop-cac-san-cau-long-nha-trang-cuc-dep-chat-luong-uy-tin-gia-ca-phai-chang-nhat-nam-2021-1.webp"
        );

        if (permissionRepository.count() == 0) seedPermissions();

        Map<String, Permission> permMap = permissionRepository.findAll().stream()
                .collect(Collectors.toMap(Permission::getPermissionName, p -> p));

        if (roleRepository.count() == 0) seedRoles(permMap);

        Role adminRole = roleRepository.findByRoleName("ADMIN").orElse(null);
        Role ownerRole = roleRepository.findByRoleName("OWNER").orElse(null);
        Role staffRole = roleRepository.findByRoleName("STAFF").orElse(null);
        Role renterRole = roleRepository.findByRoleName("RENTER").orElse(null);

        if (adminRole == null || ownerRole == null || staffRole == null || renterRole == null) return;

        if (cityRepository.count() == 0) {
            cityRepository.saveAll(List.of(City.builder().cityName("Thành Phố Hồ Chí Minh").build(), City.builder().cityName("Bình Dương").build()));
        }
        if (categoryRepository.count() == 0) seedCategories();
        if (amenityRepository.count() == 0) seedAmenities();


        // 3. Seed Users, Rank theo môn & Achievements
        if (userRepository.count() == 0) {
            String commonPass = passwordEncoder.encode("123456");
            List<User> users = new ArrayList<>();
            Random random = new Random();

            users.add(User.builder().userName("Admin main").email("admin@gmail.com").passwordHash(commonPass).gender("Male").phone("0901000011").dateOfBirth(LocalDate.of(1990, 5, 15)).provider(AuthProvider.LOCAL).role(adminRole).createdAt(LocalDateTime.now().minusYears(5)).active(true).build());
            users.add(User.builder().userName("Owner main").email("owner@gmail.com").passwordHash(commonPass).gender("Male").phone("0911000011").dateOfBirth(LocalDate.of(1985, 8, 20)).provider(AuthProvider.LOCAL).role(ownerRole).createdAt(LocalDateTime.now().minusYears(1)).active(true).build());
            users.add(User.builder().userName("Staff main").email("staff@gmail.com").passwordHash(commonPass).gender("Male").phone("0921000011").dateOfBirth(LocalDate.of(1995, 12, 1)).provider(AuthProvider.LOCAL).role(staffRole).createdAt(LocalDateTime.now().minusYears(1)).active(true).build());
            users.add(User.builder().userName("Renter main").email("renter@gmail.com").passwordHash(commonPass).gender("Male").phone("0931000011").dateOfBirth(LocalDate.of(2000, 1, 10)).provider(AuthProvider.LOCAL).role(renterRole).createdAt(LocalDateTime.now().minusYears(1)).active(true).build());

            for (int i = 1; i <= 2; i++)
                users.add(createDummyUser("Admin " + i, "admin" + i + "@gmail.com", commonPass, adminRole));
            for (int i = 1; i <= 3; i++)
                users.add(createDummyUser("Staff " + i, "staff" + i + "@gmail.com", commonPass, staffRole));
            for (int i = 1; i <= 5; i++)
                users.add(createDummyUser("Owner " + i, "owner" + i + "@gmail.com", commonPass, ownerRole));
            for (int i = 1; i <= 11; i++)
                users.add(createDummyUser("Renter " + i, "renter" + i + "@gmail.com", commonPass, renterRole));

            users = userRepository.saveAll(users);

            // --- LẤY TẤT CẢ CATEGORY ĐỂ ĐỔ DATA CHO RENTER ---
            List<Category> allCategories = categoryRepository.findAll();
            Category badminton = allCategories.stream().filter(c -> c.getCategoryName().equals("Sân cầu lông")).findFirst().orElseThrow();

            List<UserCategoryRank> rankList = new ArrayList<>();
            List<UserAchievement> achievementList = new ArrayList<>();

            Map<String, Integer> initialRanks = Map.of(
                    "admin@gmail.com", 3600,
                    "owner@gmail.com", 1500,
                    "staff@gmail.com", 800
            );

            for (User u : users) {
                // ĐỔ DATA RIÊNG CHO RENTER MAIN (Tất cả các môn)
                if (u.getEmail().equals("renter@gmail.com")) {
                    int[] fakeScores = {3025, 2100, 750}; // Cầu lông: Cao thủ, Bóng đá: Bạch kim, Pickleball: Đồng
                    int index = 0;

                    for (Category cat : allCategories) {
                        int rank = index < fakeScores.length ? fakeScores[index] : 1000;
                        int totalMatches = 50 + random.nextInt(100);
                        int totalWins = (int) (totalMatches * (0.4 + random.nextDouble() * 0.3));
                        int maxStreak = totalWins > 0 ? random.nextInt(Math.min(10, totalWins)) + 1 : 0;

                        rankList.add(UserCategoryRank.builder()
                                .user(u)
                                .category(cat)
                                .rankPoint(rank)
                                .totalMatches(totalMatches)
                                .totalWins(totalWins)
                                .currentWinStreak(random.nextInt(maxStreak + 1))
                                .build());
                        index++;
                    }

                    // Achievements cho renter
                    achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.FIRST_BLOOD).achievedAt(LocalDateTime.now().minusDays(100)).build());
                    achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.ON_FIRE).achievedAt(LocalDateTime.now().minusDays(50)).build());
                    achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.UNSTOPPABLE).achievedAt(LocalDateTime.now().minusDays(20)).build());
                    achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.VETERAN).achievedAt(LocalDateTime.now().minusDays(10)).build());

                } else {
                    // Logic cũ cho các tài khoản khác (Chỉ khởi tạo môn Cầu lông)
                    int rank = initialRanks.getOrDefault(u.getEmail(), random.nextInt(3500));
                    int totalMatches = random.nextInt(150) + (rank / 25);
                    int totalWins = (int) (totalMatches * (0.4 + random.nextDouble() * 0.25));
                    int maxStreak = totalWins > 0 ? random.nextInt(Math.min(12, totalWins)) + 1 : 0;
                    int currentStreak = maxStreak > 0 ? random.nextInt(maxStreak + 1) : 0;

                    rankList.add(UserCategoryRank.builder()
                            .user(u)
                            .category(badminton)
                            .rankPoint(rank)
                            .totalMatches(totalMatches)
                            .totalWins(totalWins)
                            .currentWinStreak(currentStreak)
                            .build());

                    if (totalWins >= 1)
                        achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.FIRST_BLOOD).achievedAt(LocalDateTime.now().minusDays(random.nextInt(100))).build());
                    if (maxStreak >= 5)
                        achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.ON_FIRE).achievedAt(LocalDateTime.now().minusDays(random.nextInt(50))).build());
                    if (maxStreak >= 10)
                        achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.UNSTOPPABLE).achievedAt(LocalDateTime.now().minusDays(random.nextInt(20))).build());
                    if (totalMatches >= 100)
                        achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.VETERAN).achievedAt(LocalDateTime.now().minusDays(random.nextInt(10))).build());
                }
            }

            userCategoryRankRepository.saveAll(rankList);
            userAchievementRepository.saveAll(achievementList);
        }

        if (courtRepository.count() == 0) seedCourtData(courtImagesList.subList(0, 2));
        if (bookingRepository.count() == 0) seedBookingAndPaymentData();
        if (postRepository.count() == 0) seedPostData();
        if (rentalAreaRepository.count() <= 1) seedMultipleRentalAreasAndPosts(courtImagesList.subList(2, 6));
    }

    private void seedPermissions() {
        List<Permission> permissions = List.of(
                Permission.builder().permissionName("VIEW_USERS").description("Xem danh sách người dùng").build(),
                Permission.builder().permissionName("VIEW_USER_DETAIL").description("Xem chi tiết một người dùng").build(),
                Permission.builder().permissionName("CREATE_USER").description("Tạo tài khoản người dùng mới").build(),
                Permission.builder().permissionName("UPDATE_USER").description("Cập nhật thông tin người dùng").build(),
                Permission.builder().permissionName("UPDATE_USER_STATUS").description("Cập nhật trạng thái người dùng (Khóa/Mở)").build(),
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
                Permission.builder().permissionName("CREATE_POST").description("Tạo bài đăng mới").build(),
                Permission.builder().permissionName("UPDATE_POST").description("Cập nhật bài đăng của mình").build(),
                Permission.builder().permissionName("DELETE_POST").description("Xóa bài đăng của mình").build(),
                Permission.builder().permissionName("VIEW_PERMISSIONS").description("Xem danh sách và chi tiết các quyền").build(),
                Permission.builder().permissionName("CREATE_PERMISSION").description("Tạo quyền hệ thống mới").build(),
                Permission.builder().permissionName("UPDATE_PERMISSION").description("Cập nhật thông tin quyền hệ thống").build(),
                Permission.builder().permissionName("DELETE_PERMISSION").description("Xóa quyền khỏi hệ thống").build(),
                Permission.builder().permissionName("CREATE_PAYMENT").description("Thực hiện thanh toán").build(),
                Permission.builder().permissionName("CREATE_NEWS").description("Đăng tin tức/thông báo mới").build(),
                Permission.builder().permissionName("UPDATE_NEWS").description("Cập nhật tin tức").build(),
                Permission.builder().permissionName("DELETE_NEWS").description("Xóa tin tức").build(),
                Permission.builder().permissionName("SUBMIT_MATCH_RESULT").description("Gửi kết quả trận đấu").build(),
                Permission.builder().permissionName("RESPOND_MATCH_RESULT").description("Xác nhận hoặc từ chối kết quả trận đấu").build(),
                Permission.builder().permissionName("CREATE_MATCH").description("Tạo trận đấu (giao lưu/cố định)").build(),
                Permission.builder().permissionName("JOIN_MATCH").description("Tham gia trận đấu đã tạo").build(),
                Permission.builder().permissionName("CONFIRM_MATCH_DEPOSIT").description("Xác nhận tiền cọc cho trận đấu").build(),
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
                Permission.builder().permissionName("MANAGE_COMMISSION").description("Thiết lập và quản lý cấu hình hoa hồng").build(),
                Permission.builder().permissionName("VIEW_COMMISSION").description("Xem bảng cấu hình phần trăm hoa hồng").build()
        );
        permissionRepository.saveAll(permissions);
    }

    private void seedRoles(Map<String, Permission> permMap) {
        Role adminRole = Role.builder().roleName("ADMIN").description("Quản trị hệ thống").active(true).permissions(new HashSet<>(permMap.values())).build();

        Set<Permission> staffPerms = getPermissions(permMap,
                "VIEW_COURTS", "VIEW_BOOKINGS", "MANAGE_BOOKING",
                "EXTEND_SLOT", "SWAP_SLOT", "USE_CHAT", "VIEW_OWNER_MATCHES"
        );
        Role staffRole = Role.builder().roleName("STAFF").description("Nhân viên quản lý sân").active(true).permissions(staffPerms).build();

        Set<Permission> ownerPerms = getPermissions(permMap,
                "VIEW_DASHBOARD_OWNER", "CREATE_RENTAL_AREA", "UPDATE_RENTAL_AREA", "DELETE_RENTAL_AREA", "CREATE_COURT", "UPDATE_COURT", "DELETE_COURT", "CREATE_COURT_COPY", "UPDATE_COURT_COPY", "CREATE_COURT_PRICE", "UPDATE_COURT_PRICE", "DELETE_COURT_PRICE", "VIEW_BOOKINGS", "MANAGE_BOOKING", "MANAGE_FINANCE", "VIEW_PAYOUT", "VIEW_COMMISSION", "USE_CHAT", "CREATE_POST", "UPDATE_POST", "DELETE_POST", "VIEW_OWNER_MATCHES");
        Role ownerRole = Role.builder().roleName("OWNER").description("Chủ sân").active(true).permissions(ownerPerms).build();

        Set<Permission> renterPerms = getPermissions(permMap,
                "BOOK_ROOM", "CREATE_PAYMENT", "USE_CHAT", "EXTEND_SLOT", "SWAP_SLOT", "CREATE_MATCH", "JOIN_MATCH", "CONFIRM_MATCH_DEPOSIT", "SUBMIT_MATCH_RESULT", "RESPOND_MATCH_RESULT", "CREATE_POST", "UPDATE_POST", "DELETE_POST", "VIEW_COURTS");
        Role renterRole = Role.builder().roleName("RENTER").description("Người thuê").active(true).permissions(renterPerms).build();

        roleRepository.saveAll(List.of(adminRole, staffRole, ownerRole, renterRole));
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
                .provider(AuthProvider.LOCAL).role(role).active(true).createdAt(LocalDateTime.now().minusDays(rand.nextInt(365))).build();
    }

    private void seedCourtData(List<String> images) {
        User owner = userRepository.findByEmail("owner@gmail.com").orElseThrow();
        City city = cityRepository.findAll().getFirst();
        Category category = categoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Sân cầu lông"))
                .findFirst().orElseThrow();

        RentalArea area = RentalArea.builder()
                .rentalAreaName("Hệ thống Sân Cầu Lông Pro - Quận 9")
                .address(Address.builder().street("456 Lê Văn Việt").district("Quận 9").ward("Hiệp Phú").city(city).build())
                .owner(owner)
                .isActive(true)
                .status(RentalAreaStatus.ACTIVE)
                .createdAt(LocalDateTime.now().minusMonths(2))
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
                    .build();
            court.getImages().add(img);

            courtRepository.save(court);

            courtCopyRepository.save(CourtCopy.builder()
                    .court(court).courtCode("STD-0" + i).courtCopyStatus(CourtCopyStatus.ACTIVE).build());

            courtPriceRepository.save(CourtPrice.builder()
                    .court(court).startTime(LocalTime.of(5, 0)).endTime(LocalTime.of(22, 0))
                    .pricePerHour(BigDecimal.valueOf(80000)).priceType(PriceType.NORMAL).priority(1).build());
        }
    }

    private void seedBookingAndPaymentData() {
        User renter = userRepository.findByEmail("renter@gmail.com").orElseThrow();
        RentalArea area = rentalAreaRepository.findAll().stream()
                .filter(a -> a.getRentalAreaName().contains("Quận 9"))
                .findFirst().orElseThrow();
        List<CourtCopy> courtCopies = courtCopyRepository.findAll().stream()
                .filter(cc -> cc.getCourt().getRentalArea().equals(area)).toList();
        if (courtCopies.isEmpty()) return;

        Random random = new Random();
        for (int i = 1; i <= 20; i++) {
            LocalDateTime createdAt = LocalDateTime.now().minusDays(random.nextInt(30)).minusHours(i);
            LocalDateTime startTime = createdAt.plusDays(1).withHour(9 + (i % 10)).withMinute(0);
            LocalDateTime endTime = startTime.plusHours(2);
            BigDecimal totalPrice = BigDecimal.valueOf(160000);

            Booking booking = Booking.builder()
                    .bookingTitle("Booking by Renter " + i).bookingStatus(BookingStatus.COMPLETED).bookingType(BookingType.ONLINE)
                    .totalPrice(totalPrice).depositAmount(totalPrice.divide(BigDecimal.valueOf(2))).remainingAmount(totalPrice.divide(BigDecimal.valueOf(2)))
                    .startTime(startTime).endTime(endTime).bookerName(renter.getUserName()).bookerPhone(renter.getPhone())
                    .rentalArea(area).renter(renter).createdAt(createdAt).build();
            booking = bookingRepository.save(booking);

            CourtCopy selectedCourt = courtCopies.get(random.nextInt(courtCopies.size()));

            slotRepository.save(Slot.builder().booking(booking).courtCopy(selectedCourt).startTime(startTime).endTime(endTime).build());

            paymentRepository.save(Payment.builder()
                    .booking(booking).user(renter).amount(totalPrice).transactionDate(createdAt.plusMinutes(15))
                    .paymentMethod(PaymentMethod.VN_PAY).paymentStatus(PaymentStatus.COMPLETED).paymentType(PaymentType.FULL)
                    .transactionCode("PAY_" + UUID.randomUUID().toString().substring(0, 10).toUpperCase()).build());
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

    private void seedPostData() {
        User owner = userRepository.findByEmail("owner@gmail.com").orElseThrow();
        RentalArea area = rentalAreaRepository.findAll().stream()
                .filter(a -> a.getOwner().equals(owner)).findFirst().orElseThrow();
        Court court = courtRepository.findAllByRentalArea(area).getFirst();
        Post post = Post.builder()
                .title("Chào mừng đến với " + area.getRentalAreaName()).description("Sân bãi tiêu chuẩn, đầy đủ tiện nghi cho mọi lứa tuổi.")
                .postStatus(PostStatus.PUBLISHED).user(owner).court(court).rentalArea(area).build();
        postRepository.save(post);
    }

    private void seedMultipleRentalAreasAndPosts(List<String> images) {
        List<User> extraOwners = userRepository.findAll().stream()
                .filter(u -> u.getRole().getRoleName().equals("OWNER") && !u.getEmail().equals("owner@gmail.com"))
                .limit(2)
                .toList();

        City city = cityRepository.findAll().getFirst();
        Category category = categoryRepository.findAll().getFirst();

        int index = 1;
        int imgIndex = 0;

        for (User owner : extraOwners) {
            RentalArea area = RentalArea.builder()
                    .rentalAreaName("Khu sân của " + owner.getUserName())
                    .address(Address.builder().street("Đường " + index).district("Quận 2").ward("Thạnh Mỹ Lợi").city(city).build())
                    .owner(owner)
                    .isActive(true)
                    .status(RentalAreaStatus.ACTIVE)
                    .build();
            rentalAreaRepository.save(area);

            Court firstCourt = null;
            for (int c = 1; c <= 2; c++) {
                Court court = Court.builder()
                        .courtName("Sân " + owner.getUserName() + " " + c)
                        .surfaceType("Gỗ")
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
                        .build();
                court.getImages().add(img);

                courtRepository.save(court);

                if (c == 1) firstCourt = court;

                courtCopyRepository.save(CourtCopy.builder()
                        .court(court).courtCode("EXT-" + index + "-" + c).courtCopyStatus(CourtCopyStatus.ACTIVE).build());

                courtPriceRepository.save(CourtPrice.builder()
                        .court(court).startTime(LocalTime.of(6, 0)).endTime(LocalTime.of(21, 0))
                        .pricePerHour(BigDecimal.valueOf(100000)).priceType(PriceType.NORMAL).priority(1).build());
            }

            Post post = Post.builder()
                    .title("Ưu đãi đặc biệt từ " + owner.getUserName())
                    .description("Giảm giá 10% cho khách hàng mới đặt sân lần đầu.")
                    .postStatus(PostStatus.PUBLISHED)
                    .user(owner)
                    .court(firstCourt)
                    .rentalArea(area)
                    .build();
            postRepository.save(post);

            index++;
        }
    }
}