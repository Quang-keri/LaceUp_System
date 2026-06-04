package org.sport.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {

    // Authentication
    LOGIN_FAILED(
            1000,
            "Email hoặc mật khẩu không đúng",
            HttpStatus.BAD_REQUEST
    ),
    UNAUTHENTICATED(
            1001,
            "Bạn chưa đăng nhập",
            HttpStatus.UNAUTHORIZED
    ),
    UNAUTHORIZED(
            1002,
            "Bạn không có quyền thực hiện chức năng này",
            HttpStatus.FORBIDDEN
    ),
    REFRESH_TOKEN_NOT_FOUND(
            1003,
            "Không tìm thấy phiên đăng nhập",
            HttpStatus.UNAUTHORIZED
    ),
    REFRESH_TOKEN_REVOKED(
            1004,
            "Phiên đăng nhập đã bị thu hồi",
            HttpStatus.FORBIDDEN
    ),
    INVALID_TOKEN_TYPE(
            1005,
            "Token không hợp lệ",
            HttpStatus.BAD_REQUEST
    ),
    LOGOUT_FAILED(
            1006,
            "Đăng xuất thất bại",
            HttpStatus.INTERNAL_SERVER_ERROR
    ),
    REFRESH_TOKEN_EXPIRED(
            1007,
            "Phiên đăng nhập đã hết hạn",
            HttpStatus.UNAUTHORIZED
    ),
    SOCIAL_ACCOUNT_REQUIRED(
            1008,
            "Tài khoản này chỉ đăng nhập bằng Google",
            HttpStatus.BAD_REQUEST
    ),

    // User
    USER_EXISTED(
            2001,
            "Email đã tồn tại",
            HttpStatus.BAD_REQUEST
    ),
    USER_NOT_FOUND(
            2002,
            "Không tìm thấy người dùng",
            HttpStatus.NOT_FOUND
    ),
    USER_NOT_AUTHENTICATED(
            2003,
            "Người dùng chưa được xác thực",
            HttpStatus.UNAUTHORIZED
    ),
    EMAIL_NOT_FOUND(
            2004,
            "Không tìm thấy email",
            HttpStatus.NOT_FOUND
    ),
    USER_LOCKED(
            2005,
            "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên",
            HttpStatus.FORBIDDEN
    ),

    // Role
    ROLE_NOT_FOUND(
            3001,
            "Không tìm thấy vai trò",
            HttpStatus.NOT_FOUND
    ),

    // Permission
    PERMISSION_NOT_FOUND(
            3002,
            "Không tìm thấy quyền",
            HttpStatus.NOT_FOUND
    ),
    PERMISSION_EXISTED(
            3003,
            "Quyền đã tồn tại",
            HttpStatus.BAD_REQUEST
    ),

    // Pagination
    INVALID_PAGINATION(
            4001,
            "Thông tin phân trang không hợp lệ",
            HttpStatus.BAD_REQUEST
    ),

    // Rental Area
    RENTAL_AREA_NOT_FOUND(
            4004,
            "Không tìm thấy khu thể thao",
            HttpStatus.NOT_FOUND
    ),

    // Court
    COURT_NOT_FOUND(
            4005,
            "Không tìm thấy sân",
            HttpStatus.NOT_FOUND
    ),

    // Category
    CATEGORY_NOT_FOUND(
            4006,
            "Không tìm thấy danh mục",
            HttpStatus.NOT_FOUND
    ),

    // Post
    POST_NOT_FOUND(
            4007,
            "Không tìm thấy bài viết",
            HttpStatus.NOT_FOUND
    ),

    // QR
    QR_NOT_FOUND(
            4008,
            "Mã QR không hợp lệ",
            HttpStatus.BAD_REQUEST
    ),
    QR_INVALID(
            4009,
            "Mã QR không hợp lệ",
            HttpStatus.BAD_REQUEST
    ),
    QR_ALREADY_USED(
            4010,
            "Mã QR đã được sử dụng",
            HttpStatus.BAD_REQUEST
    ),
    QR_EXPIRED(
            4011,
            "Mã QR đã hết hạn",
            HttpStatus.BAD_REQUEST
    ),

    // Booking
    BOOKING_NOT_FOUND(
            4012,
            "Không tìm thấy lịch đặt sân",
            HttpStatus.NOT_FOUND
    ),
    BOOKING_INTENT_NOT_FOUND(
            4013,
            "Không tìm thấy đơn đặt sân",
            HttpStatus.NOT_FOUND
    ),
    BOOKING_ALREADY_CHECKED_IN(
            4014,
            "Lịch đặt sân đã được check-in",
            HttpStatus.BAD_REQUEST
    ),
    CANNOT_CHECKOUT_BEFORE_CHECKIN(
            4015,
            "Không thể check-out khi chưa check-in",
            HttpStatus.BAD_REQUEST
    ),

    // Slot
    SLOT_NOT_FOUND(
            4016,
            "Không tìm thấy khung giờ",
            HttpStatus.NOT_FOUND
    ),
    SLOT_CONFLICT(
            4017,
            "Khung giờ đã được đặt",
            HttpStatus.CONFLICT
    ),

    // City
    CITY_NOT_FOUND(
            4018,
            "Không tìm thấy thành phố",
            HttpStatus.NOT_FOUND
    );

    private final int code;
    private final String message;
    private final HttpStatusCode httpStatusCode;

    ErrorCode(
            int code,
            String message,
            HttpStatusCode httpStatusCode
    ) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}