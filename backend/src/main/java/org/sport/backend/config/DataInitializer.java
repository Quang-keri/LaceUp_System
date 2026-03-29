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
    private final UserStatsRepository userStatsRepository;
    private final UserAchievementRepository userAchievementRepository;

    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String @NonNull ... args) {

        if (permissionRepository.count() == 0) {
            List<Permission> permissions = List.of(

                    Permission.builder().permissionName("VIEW_USERS").description("Xem danh sách người dùng").build(),
                    Permission.builder().permissionName("VIEW_USER_DETAIL").description("Xem chi tiết một người dùng").build(),
                    Permission.builder().permissionName("CREATE_USER").description("Tạo tài khoản người dùng mới").build(),
                    Permission.builder().permissionName("UPDATE_USER").description("Cập nhật thông tin người dùng").build(),
                    Permission.builder().permissionName("UPDATE_USER_STATUS").description("Cập nhật trạng thái người dùng (Khóa/Mở)").build(),

                    Permission.builder().permissionName("ASSIGN_ROLE").description("Gán vai trò (Role) cho người dùng").build(),
                    Permission.builder().permissionName("GRANT_EXTRA_PERMISSION").description("Cấp quyền riêng lẻ cho người dùng").build(),
                    Permission.builder().permissionName("REVOKE_EXTRA_PERMISSION").description("Thu hồi quyền riêng lẻ của người dùng").build(),
                    Permission.builder().permissionName("VIEW_USER_AUTHORITIES").description("Xem danh sách quyền của người dùng").build(),

                    // --- NHÓM QUẢN LÝ VAI TRÒ (ROLE CONTROLLER) ---
                    Permission.builder().permissionName("VIEW_ROLES").description("Xem danh sách và chi tiết vai trò").build(),
                    Permission.builder().permissionName("CREATE_ROLE").description("Tạo mới vai trò").build(),
                    Permission.builder().permissionName("UPDATE_ROLE").description("Cập nhật thông tin và trạng thái vai trò").build(),
                    Permission.builder().permissionName("MANAGE_ROLE_PERMISSIONS").description("Thêm hoặc xóa quyền của vai trò").build(),

                    // --- NHÓM QUẢN LÝ SLOT / ĐẶT SÂN (SLOT CONTROLLER) ---
                    Permission.builder().permissionName("VIEW_COURTS").description("Xem danh sách sân trong khu vực").build(),
                    Permission.builder().permissionName("EXTEND_SLOT").description("Gia hạn thời gian thuê sân").build(),
                    Permission.builder().permissionName("SWAP_SLOT").description("Đổi sân hoặc đổi giờ thuê").build(),

                    Permission.builder().permissionName("VIEW_DASHBOARD_ADMIN").description("Xem bảng admin").build(),

                    // --- NHÓM QUẢN LÝ KHU VỰC THUÊ / CƠ SỞ (RENTAL AREA CONTROLLER) ---
                    Permission.builder().permissionName("CREATE_RENTAL_AREA").description("Tạo mới khu vực cho thuê (Cơ sở)").build(),
                    Permission.builder().permissionName("UPDATE_RENTAL_AREA").description("Cập nhật thông tin khu vực cho thuê").build(),
                    Permission.builder().permissionName("DELETE_RENTAL_AREA").description("Xóa/Vô hiệu hóa khu vực cho thuê").build(),
                    Permission.builder().permissionName("DELETE_RENTAL_AREA").description("Xóa/Vô hiệu hóa khu vực cho thuê").build(),

                    // --- NHÓM QUẢN LÝ BÀI ĐĂNG (POST CONTROLLER) ---
                    Permission.builder().permissionName("CREATE_POST").description("Tạo bài đăng mới").build(),
                    Permission.builder().permissionName("UPDATE_POST").description("Cập nhật bài đăng của mình").build(),
                    Permission.builder().permissionName("DELETE_POST").description("Xóa bài đăng của mình").build(),

                    // --- NHÓM QUẢN LÝ QUYỀN HẠN (PERMISSION CONTROLLER) ---
                    Permission.builder().permissionName("VIEW_PERMISSIONS").description("Xem danh sách và chi tiết các quyền").build(),
                    Permission.builder().permissionName("CREATE_PERMISSION").description("Tạo quyền hệ thống mới").build(),
                    Permission.builder().permissionName("UPDATE_PERMISSION").description("Cập nhật thông tin quyền hệ thống").build(),
                    Permission.builder().permissionName("DELETE_PERMISSION").description("Xóa quyền khỏi hệ thống").build(),

                    Permission.builder().permissionName("CREATE_PAYMENT").description("Thực hiện thanh toán").build(),

                    // --- NHÓM QUẢN LÝ TIN TỨC (NEWS CONTROLLER) ---
                    Permission.builder().permissionName("CREATE_NEWS").description("Đăng tin tức/thông báo mới").build(),
                    Permission.builder().permissionName("UPDATE_NEWS").description("Cập nhật tin tức").build(),
                    Permission.builder().permissionName("DELETE_NEWS").description("Xóa tin tức").build(),

                    // --- NHÓM QUẢN LÝ KẾT QUẢ TRẬN ĐẤU (MATCH RESULT CONTROLLER) ---
                    Permission.builder().permissionName("SUBMIT_MATCH_RESULT").description("Gửi kết quả trận đấu").build(),
                    Permission.builder().permissionName("RESPOND_MATCH_RESULT").description("Xác nhận hoặc từ chối kết quả trận đấu").build(),

                    // --- NHÓM QUẢN LÝ TRẬN ĐẤU / KÈO ĐẤU (MATCH CONTROLLER) ---
                    Permission.builder().permissionName("CREATE_MATCH").description("Tạo trận đấu (giao lưu/cố định)").build(),
                    Permission.builder().permissionName("JOIN_MATCH").description("Tham gia trận đấu đã tạo").build(),
                    Permission.builder().permissionName("CONFIRM_MATCH_DEPOSIT").description("Xác nhận tiền cọc cho trận đấu").build(),
                    Permission.builder().permissionName("VIEW_ALL_MATCHES").description("Xem toàn bộ danh sách trận đấu trên hệ thống").build(),
                    Permission.builder().permissionName("VIEW_OWNER_MATCHES").description("Xem danh sách trận đấu diễn ra tại sân của mình").build(),

                    // --- NHÓM QUẢN LÝ GIÁ SÂN (COURT PRICE CONTROLLER) ---
                    Permission.builder().permissionName("CREATE_COURT_PRICE").description("Tạo cấu hình giá thuê sân").build(),
                    Permission.builder().permissionName("UPDATE_COURT_PRICE").description("Cập nhật giá thuê sân").build(),
                    Permission.builder().permissionName("DELETE_COURT_PRICE").description("Xóa cấu hình giá thuê sân").build(),

                    // --- NHÓM QUẢN LÝ SÂN VẬT LÝ (COURT COPY CONTROLLER) ---
                    Permission.builder().permissionName("CREATE_COURT_COPY").description("Thêm mới sân vật lý vào cơ sở").build(),
                    Permission.builder().permissionName("UPDATE_COURT_COPY").description("Cập nhật thông tin/trạng thái sân vật lý").build(),

                    // --- NHÓM QUẢN LÝ LOẠI SÂN (COURT CONTROLLER) ---
                    Permission.builder().permissionName("CREATE_COURT").description("Tạo mới loại sân trong khu vực").build(),
                    Permission.builder().permissionName("UPDATE_COURT").description("Cập nhật thông tin loại sân").build(),
                    Permission.builder().permissionName("DELETE_COURT").description("Xóa loại sân").build(),

                    Permission.builder().permissionName("USE_CHAT").description("Sử dụng tính năng nhắn tin nội bộ").build(),

                    // --- NHÓM QUẢN LÝ DANH MỤC SÂN (CATEGORY CONTROLLER) ---
                    Permission.builder().permissionName("CREATE_CATEGORY").description("Tạo danh mục môn thể thao mới").build(),
                    Permission.builder().permissionName("UPDATE_CATEGORY").description("Cập nhật danh mục thể thao").build(),
                    Permission.builder().permissionName("DELETE_CATEGORY").description("Xóa danh mục thể thao").build(),

                    // --- NHÓM QUẢN LÝ ĐẶT SÂN VÀ GIAO DỊCH (BOOKING & FINANCE) ---

                    // 1. Dành cho Người thuê (Renter)
                    Permission.builder().permissionName("BOOK_ROOM").description("Thực hiện đặt sân và tạo giao dịch").build(),

                    // 2. Dành cho Chủ sân, Nhân viên, Admin (Xem dữ liệu)
                    Permission.builder().permissionName("VIEW_BOOKINGS").description("Xem danh sách chi tiết các đơn đặt sân").build(),

                    // 3. Dành cho Chủ sân, Admin (Thao tác sửa đổi đơn)
                    Permission.builder().permissionName("MANAGE_BOOKING").description("Cập nhật trạng thái/thông tin đơn đặt sân").build(),

                    // 4. Dành cho Chủ sân, Admin (Thao tác tiền bạc)
                    Permission.builder().permissionName("MANAGE_FINANCE").description("Quản lý tài chính, xác nhận thu tiền khách").build(),

                    // --- NHÓM QUẢN LÝ TIỆN ÍCH (AMENITY CONTROLLER) ---
                    Permission.builder().permissionName("CREATE_AMENITY").description("Tạo mới tiện ích hệ thống").build(),
                    Permission.builder().permissionName("UPDATE_AMENITY").description("Cập nhật tiện ích hệ thống").build(),
                    Permission.builder().permissionName("DELETE_AMENITY").description("Xóa tiện ích hệ thống").build(),

                    // --- NHÓM QUẢN LÝ THANH TOÁN CHO CHỦ SÂN (PAYOUT CONTROLLER) ---
                    Permission.builder().permissionName("MANAGE_PAYOUT").description("Xác nhận chuyển tiền/thanh toán cho chủ sân").build(),
                    Permission.builder().permissionName("VIEW_PAYOUT").description("Xem lịch sử nhận tiền của cơ sở").build(),

                    // --- NHÓM QUẢN LÝ CẤU HÌNH HOA HỒNG (COMMISSION CONTROLLER) ---
                    Permission.builder().permissionName("MANAGE_COMMISSION").description("Thiết lập và quản lý cấu hình hoa hồng").build(),
                    Permission.builder().permissionName("VIEW_COMMISSION").description("Xem bảng cấu hình phần trăm hoa hồng").build()


            );
            permissionRepository.saveAll(permissions);
        }

        Map<String, Permission> permMap = permissionRepository.findAll().stream()
                .collect(Collectors.toMap(Permission::getPermissionName, p -> p));

        // 2. Seed Roles
        if (roleRepository.count() == 0) {
            Role adminRole = Role.builder().roleName("ADMIN").description("Quản trị hệ thống").active(true).permissions(new HashSet<>(permMap.values())).build();
            Role staffRole = Role.builder().roleName("STAFF").description("Nhân viên vận hành").active(true).permissions(Set.of(permMap.get("VIEW_DASHBOARD"), permMap.get("APPROVE_POST"), permMap.get("SUPPORT_CUSTOMER"), permMap.get("SEARCH_ROOM"))).build();
            Role ownerRole = Role.builder().roleName("OWNER").description("Chủ sân").active(true).permissions(Set.of(permMap.get("VIEW_DASHBOARD"), permMap.get("POST_ROOM"), permMap.get("UPDATE_ROOM"), permMap.get("VIEW_BOOKINGS"), permMap.get("MANAGE_FINANCE"))).build();
            Role renterRole = Role.builder().roleName("RENTER").description("Người thuê").active(true).permissions(Set.of(permMap.get("SEARCH_ROOM"), permMap.get("BOOK_ROOM"), permMap.get("CHAT_WITH_OWNER"), permMap.get("WRITE_REVIEW"))).build();
            roleRepository.saveAll(List.of(adminRole, staffRole, ownerRole, renterRole));
        }

        Role adminRole = roleRepository.findByRoleName("ADMIN").orElse(null);
        Role ownerRole = roleRepository.findByRoleName("OWNER").orElse(null);
        Role staffRole = roleRepository.findByRoleName("STAFF").orElse(null);
        Role renterRole = roleRepository.findByRoleName("RENTER").orElse(null);

        // 3. Seed Users, Stats & Achievements
        if (userRepository.count() == 0) {
            String commonPass = passwordEncoder.encode("123456");
            List<User> users = new ArrayList<>();
            Random random = new Random();

            users.add(User.builder()
                    .userName("Admin main")
                    .email("admin@gmail.com")
                    .passwordHash(commonPass)
                    .gender("Male")
                    .phone("0901000011")
                    .dateOfBirth(LocalDate.of(1990, 5, 15))
                    .provider(AuthProvider.LOCAL)
                    .role(adminRole)
                    .createdAt(LocalDateTime.now().minusYears(5))
                    .active(true)
                    .rankPoint(3600) // Thách đấu
                    .build());

            users.add(User.builder()
                    .userName("Owner main")
                    .email("owner@gmail.com")
                    .passwordHash(commonPass)
                    .gender("Male")
                    .phone("0911000011")
                    .dateOfBirth(LocalDate.of(1985, 8, 20))
                    .provider(AuthProvider.LOCAL)
                    .role(ownerRole)
                    .createdAt(LocalDateTime.now().minusYears(1))
                    .active(true)
                    .rankPoint(1500) // Vàng
                    .build());

            users.add(User.builder()
                    .userName("Staff main")
                    .email("staff@gmail.com")
                    .passwordHash(commonPass)
                    .gender("Male")
                    .phone("0921000011")
                    .dateOfBirth(LocalDate.of(1995, 12, 1))
                    .provider(AuthProvider.LOCAL)
                    .role(staffRole)
                    .createdAt(LocalDateTime.now().minusYears(1))
                    .active(true)
                    .rankPoint(800) // Đồng
                    .build());

            users.add(User.builder()
                    .userName("Renter main")
                    .email("renter@gmail.com")
                    .passwordHash(commonPass)
                    .gender("Male")
                    .phone("0931000011")
                    .dateOfBirth(LocalDate.of(2000, 1, 10))
                    .provider(AuthProvider.LOCAL)
                    .role(renterRole)
                    .createdAt(LocalDateTime.now().minusYears(1))
                    .active(true)
                    .rankPoint(3025) // Cao Thủ
                    .build());

            // Tạo Admins, Staffs, Owners
            for (int i = 1; i <= 2; i++)
                users.add(createDummyUser("Admin " + i, "admin" + i + "@gmail.com", commonPass, adminRole, random.nextInt(3500)));
            for (int i = 1; i <= 3; i++)
                users.add(createDummyUser("Staff " + i, "staff" + i + "@gmail.com", commonPass, staffRole, random.nextInt(2000)));
            for (int i = 1; i <= 5; i++)
                users.add(createDummyUser("Owner " + i, "owner" + i + "@gmail.com", commonPass, ownerRole, random.nextInt(2500)));
            for (int i = 1; i <= 11; i++)
                users.add(createDummyUser("Renter " + i, "renter" + i + "@gmail.com", commonPass, renterRole, random.nextInt(3200)));

            // Lưu Users trước để có UUID
            users = userRepository.saveAll(users);

            // Sinh dữ liệu Stats và Achievements cho từng User
            List<UserStats> statsList = new ArrayList<>();
            List<UserAchievement> achievementList = new ArrayList<>();

            for (User u : users) {
                int rank = u.getRankPoint();
                int totalMatches = random.nextInt(150) + (rank / 25); // Rank cao thường đánh nhiều trận
                int totalWins = (int) (totalMatches * (0.4 + random.nextDouble() * 0.25)); // Tỉ lệ thắng 40% - 65%
                int maxStreak = totalWins > 0 ? random.nextInt(Math.min(12, totalWins)) + 1 : 0;
                int currentStreak = maxStreak > 0 ? random.nextInt(maxStreak + 1) : 0;

                statsList.add(UserStats.builder()
                        .user(u)
                        .totalMatches(totalMatches)
                        .totalWins(totalWins)
                        .maxWinStreak(maxStreak)
                        .currentWinStreak(currentStreak)
                        .build());

                // Cấp phát huy hiệu dựa trên chỉ số vừa sinh
                if (totalWins >= 1) {
                    achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.FIRST_BLOOD).achievedAt(LocalDateTime.now().minusDays(random.nextInt(100))).build());
                }
                if (maxStreak >= 5) {
                    achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.ON_FIRE).achievedAt(LocalDateTime.now().minusDays(random.nextInt(50))).build());
                }
                if (maxStreak >= 10) {
                    achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.UNSTOPPABLE).achievedAt(LocalDateTime.now().minusDays(random.nextInt(20))).build());
                }
                if (totalMatches >= 100) {
                    achievementList.add(UserAchievement.builder().user(u).achievementType(AchievementType.VETERAN).achievedAt(LocalDateTime.now().minusDays(random.nextInt(10))).build());
                }
            }

            userStatsRepository.saveAll(statsList);
            userAchievementRepository.saveAll(achievementList);
        }

        // 4. Seed Cities, Categories, Amenities
        if (cityRepository.count() == 0) {
            cityRepository.saveAll(List.of(City.builder().cityName("Thành Phố Hồ Chí Minh").build(), City.builder().cityName("Bình Dương").build()));
        }
        if (categoryRepository.count() == 0) seedCategories();
        if (amenityRepository.count() == 0) seedAmenities();

        // 5. Seed Court Data (Sân bãi)
        if (courtRepository.count() == 0) {
            seedCourtData();
        }

        // 6. Seed Booking & Payment (Dữ liệu giao dịch)
        if (bookingRepository.count() == 0) {
            seedBookingAndPaymentData();
        }

        if (postRepository.count() == 0) {
            seedPostData();
        }

        if (rentalAreaRepository.count() < 4) {
            seedMultipleRentalAreasAndPosts();
        }
    }

    // Hàm phụ trợ tạo User nhanh cho gọn code
    private User createDummyUser(String name, String email, String pass, Role role, int rankPoint) {
        Random rand = new Random();
        return User.builder()
                .userName(name)
                .email(email)
                .passwordHash(pass)
                .gender(rand.nextBoolean() ? "Male" : "Female")
                .phone("09" + (10000000 + rand.nextInt(90000000)))
                .dateOfBirth(LocalDate.of(1980 + rand.nextInt(25), 1 + rand.nextInt(12), 1 + rand.nextInt(28)))
                .provider(AuthProvider.LOCAL)
                .role(role)
                .active(true)
                .createdAt(LocalDateTime.now().minusDays(rand.nextInt(365)))
                .rankPoint(rankPoint)
                .build();
    }

    private void seedCourtData() {
        User owner = userRepository.findByEmail("owner@gmail.com").orElseThrow();
        City city = cityRepository.findAll().getFirst();
        Category category = categoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Sân cầu lông"))
                .findFirst().orElseThrow();

        Address areaAddress = Address.builder()
                .street("456 Lê Văn Việt")
                .district("Quận 9")
                .ward("Hiệp Phú")
                .city(city)
                .build();

        RentalArea area = RentalArea.builder()
                .rentalAreaName("Hệ thống Sân Cầu Lông Pro - Owner Management")
                .address(areaAddress)
                .owner(owner) // Gán cho owner
                .isActive(true)
                .status(RentalAreaStatus.ACTIVE)
                .createdAt(LocalDateTime.now().minusMonths(2))
                .build();
        rentalAreaRepository.save(area);

        Court court = Court.builder()
                .courtName("Sân VIP 01")
                .surfaceType("Thảm PVC")
                .courtStatus(CourtStatus.ACTIVE)
                .indoor(true)
                .rentalArea(area)
                .category(category)
                .build();
        courtRepository.save(court);

        for (int i = 1; i <= 2; i++) {
            courtCopyRepository.save(CourtCopy.builder()
                    .court(court)
                    .courtCode("VIP01-" + i)
                    .courtCopyStatus(CourtCopyStatus.ACTIVE)
                    .build());
        }

        courtPriceRepository.saveAll(List.of(
                CourtPrice.builder().court(court).startTime(LocalTime.of(5, 0)).endTime(LocalTime.of(22, 0))
                        .pricePerHour(BigDecimal.valueOf(80000)).priceType(PriceType.NORMAL).priority(1).build()
        ));
    }

    private void seedBookingAndPaymentData() {
        User renter = userRepository.findByEmail("renter@gmail.com").orElseThrow();
        RentalArea area = rentalAreaRepository.findAll().stream()
                .filter(a -> a.getRentalAreaName().contains("Owner Management"))
                .findFirst().orElseThrow();
        CourtCopy courtCopy = courtCopyRepository.findAll().stream()
                .filter(cc -> cc.getCourt().getRentalArea().equals(area))
                .findFirst().orElseThrow();

        Random random = new Random();

        for (int i = 1; i <= 20; i++) {
            LocalDateTime createdAt = LocalDateTime.now().minusDays(random.nextInt(30)).minusHours(i);
            LocalDateTime startTime = createdAt.plusDays(1).withHour(9 + (i % 10)).withMinute(0);
            LocalDateTime endTime = startTime.plusHours(2);

            BigDecimal totalPrice = BigDecimal.valueOf(160000); // 80k * 2h

            Booking booking = Booking.builder()
                    .bookingTitle("Booking by Renter " + i)
                    .bookingStatus(BookingStatus.COMPLETED)
                    .bookingType(BookingType.ONLINE)
                    .totalPrice(totalPrice)
                    .depositAmount(totalPrice.divide(BigDecimal.valueOf(2)))
                    .remainingAmount(totalPrice.divide(BigDecimal.valueOf(2)))
                    .startTime(startTime)
                    .endTime(endTime)
                    .bookerName(renter.getUserName())
                    .bookerPhone(renter.getPhone())
                    .rentalArea(area)
                    .renter(renter)
                    .createdAt(createdAt)
                    .build();

            booking = bookingRepository.save(booking);

            slotRepository.save(Slot.builder()
                    .booking(booking)
                    .courtCopy(courtCopy)
                    .startTime(startTime)
                    .endTime(endTime)
                    .build());

            paymentRepository.save(Payment.builder()
                    .booking(booking)
                    .user(renter)
                    .amount(totalPrice)
                    .transactionDate(createdAt.plusMinutes(15))
                    .paymentMethod(PaymentMethod.VN_PAY)
                    .paymentStatus(PaymentStatus.COMPLETED)
                    .paymentType(PaymentType.FULL)
                    .transactionCode("OWNER_PAY_" + System.currentTimeMillis() + i)
                    .build());
        }
    }

    private void seedCategories() {
        List.of("Sân cầu lông", "Sân bóng đá", "Sân pickleball").forEach(name -> {
            if (!categoryRepository.existsByCategoryName(name)) {
                categoryRepository.save(Category.builder().categoryName(name).build());
            }
        });
    }

    private void seedAmenities() {
        List.of(
                Amenity.builder().amenityName("Wifi tốc độ cao").iconKey("FaWifi").build(),
                Amenity.builder().amenityName("Ổ điện").iconKey("FaPlug").build()
        ).forEach(a -> {
            if (!amenityRepository.existsByAmenityName(a.getAmenityName())) {
                amenityRepository.save(a);
            }
        });
    }

    private void seedPostData() {
        User owner = userRepository.findByEmail("owner@gmail.com")
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        RentalArea area = rentalAreaRepository.findAll().stream()
                .filter(a -> a.getOwner().equals(owner))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Rental Area not found for owner"));

        Court court = courtRepository.findAll().stream()
                .filter(c -> c.getRentalArea().equals(area))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Court not found for area"));

        List<Post> posts = List.of(
                Post.builder()
                        .title("Sân cầu lông VIP Quận 9 - Giảm giá 20% khung giờ sáng")
                        .description("Sân thảm PVC tiêu chuẩn thi đấu, đầy đủ wifi, nước uống và bãi xe rộng rãi.")
                        .postStatus(PostStatus.PUBLISHED) // Giả định enum có trạng thái này
                        .user(owner)
                        .court(court)
                        .rentalArea(area)
                        .build(),

                Post.builder()
                        .title("Tìm đối thủ giao lưu tại Sân VIP 01 tối nay")
                        .description("Cần tìm nhóm trình độ trung bình khá giao lưu từ 18h-20h. Sân đã đặt sẵn.")
                        .postStatus(PostStatus.PUBLISHED)
                        .user(owner)
                        .court(court)
                        .rentalArea(area)
                        .build(),

                Post.builder()
                        .title("Ưu đãi đặt sân cố định tháng 4")
                        .description("Đăng ký slot cố định hàng tuần để nhận ưu đãi giá cực tốt tại cụm sân Lê Văn Việt.")
                        .postStatus(PostStatus.PUBLISHED)
                        .user(owner)
                        .court(court)
                        .rentalArea(area)
                        .build()
        );

        postRepository.saveAll(posts);
    }

    private void seedMultipleRentalAreasAndPosts() {
        List<User> owners = userRepository.findAll().stream()
                .filter(u -> u.getRole().getRoleName().equals("OWNER"))
                .limit(3)
                .toList();

        City city = cityRepository.findAll().getFirst();
        Category category = categoryRepository.findAll().getFirst();

        int index = 1;

        for (User owner : owners) {

            // Tạo RentalArea
            Address address = Address.builder()
                    .street("Đường số " + (100 + index))
                    .district("Quận " + (index + 1))
                    .ward("Phường " + index)
                    .city(city)
                    .build();

            RentalArea area = RentalArea.builder()
                    .rentalAreaName("Khu sân " + owner.getUserName())
                    .address(address)
                    .owner(owner)
                    .isActive(true)
                    .status(RentalAreaStatus.ACTIVE)
                    .createdAt(LocalDateTime.now().minusDays(index * 5L))
                    .build();

            rentalAreaRepository.save(area);

            // Tạo Court
            Court court = Court.builder()
                    .courtName("Sân chính " + index)
                    .surfaceType("Thảm PVC")
                    .courtStatus(CourtStatus.ACTIVE)
                    .indoor(true)
                    .rentalArea(area)
                    .category(category)
                    .build();

            courtRepository.save(court);

            // 1 CourtCopy
            CourtCopy courtCopy = CourtCopy.builder()
                    .court(court)
                    .courtCode("COURT-" + index)
                    .courtCopyStatus(CourtCopyStatus.ACTIVE)
                    .build();

            courtCopyRepository.save(courtCopy);

            // Price
            courtPriceRepository.save(
                    CourtPrice.builder()
                            .court(court)
                            .startTime(LocalTime.of(6, 0))
                            .endTime(LocalTime.of(22, 0))
                            .pricePerHour(BigDecimal.valueOf(90000 + index * 10000L))
                            .priceType(PriceType.NORMAL)
                            .priority(1)
                            .build()
            );

            // 👉 MỖI AREA CHỈ 1 POST
            Post post = Post.builder()
                    .title("Sân mới khai trương - " + owner.getUserName())
                    .description("Không gian rộng rãi, ánh đèn dịu nhẹ, phù hợp cho những trận đấu đầy cảm xúc.")
                    .postStatus(PostStatus.PUBLISHED)
                    .user(owner)
                    .court(court)
                    .rentalArea(area)
                    .build();

            postRepository.save(post);

            index++;
        }
    }
}