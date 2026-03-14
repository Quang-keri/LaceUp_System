package org.sport.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {

    //AUTHENTICATION
    LOGIN_FAILED(1000, "Email or Password is invalid!", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1001, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1002, "You do not have permission", HttpStatus.FORBIDDEN),
    REFRESH_TOKEN_NOT_FOUND(1003, "Refresh token not found", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_REVOKED(1004, "Refresh token has been revoked", HttpStatus.FORBIDDEN),
    INVALID_TOKEN_TYPE(1005, "Invalid token type", HttpStatus.BAD_REQUEST),
    LOGOUT_FAILED(1006, "Logout failed", HttpStatus.INTERNAL_SERVER_ERROR),
    REFRESH_TOKEN_EXPIRED(1007, "Refresh token expired", HttpStatus.UNAUTHORIZED),
    SOCIAL_ACCOUNT_REQUIRED(1008, "Social account required", HttpStatus.BAD_REQUEST),

    //User
    USER_EXISTED(2001, "Email existed", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(2002, "User not found", HttpStatus.NOT_FOUND),
    USER_NOT_AUTHENTICATED(2003, "User not authenticated", HttpStatus.UNAUTHORIZED),
    EMAIL_NOT_FOUND(2004, "Email not found", HttpStatus.NOT_FOUND),
    USER_LOCKED(2005, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.", HttpStatus.FORBIDDEN),

    //Role
    ROLE_NOT_FOUND(3001, "Role not found", HttpStatus.NOT_FOUND),

    //Permission
    PERMISSION_NOT_FOUND(3002, "Permission not found", HttpStatus.NOT_FOUND),
    PERMISSION_EXISTED(3003, "Permission existed", HttpStatus.BAD_REQUEST),

    // Page Errors
    INVALID_PAGINATION(4001, "Invalid pagination parameters", HttpStatus.BAD_REQUEST),


    // Rental Area
    RENTAL_AREA_NOT_FOUND(4004, "Rental area not found", HttpStatus.NOT_FOUND),  // đổi 4001→4004

//COURT_NOT_FOUND
COURT_NOT_FOUND(4004,"Court not found",HttpStatus.NOT_FOUND),
    //CATEGORY NOT FOUND
    CATEGORY_NOT_FOUND(4004,"Category not found",HttpStatus.NOT_FOUND),

    //POST_NOT_FOUND
    POST_NOT_FOUND(4004,"Post not found",HttpStatus.NOT_FOUND),

    //QR
    QR_NOT_FOUND(4000, "QR không hợp lệ",HttpStatus.BAD_REQUEST),
    QR_INVALID(4000, "QR không hợp lệ",HttpStatus.BAD_REQUEST),
    QR_ALREADY_USED(4000, "QR đã dùng",HttpStatus.BAD_REQUEST),
    QR_EXPIRED(4000, "QR hết hạn",HttpStatus.BAD_REQUEST),
    BOOKING_NOT_FOUND(4004, "Không tìm thấy booking",HttpStatus.NOT_FOUND),
    BOOKING_INTENT_NOT_FOUND(4004, "Không tìm thấy booking intent",HttpStatus.NOT_FOUND),
    BOOKING_ALREADY_CHECKED_IN(4000, "Đã check-in rồi",HttpStatus.BAD_REQUEST),
    CANNOT_CHECKOUT_BEFORE_CHECKIN(4000, "Chưa check-in thì không thể check-out",HttpStatus.BAD_REQUEST),


    //City
    CITY_NOT_FOUND(4000, "City không tìm thấy", HttpStatus.NOT_FOUND),
    ;


    private int code;
    private String message;
    private HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}
