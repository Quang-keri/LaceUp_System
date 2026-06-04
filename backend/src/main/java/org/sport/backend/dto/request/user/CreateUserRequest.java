package org.sport.backend.dto.request.user;

import com.fasterxml.jackson.annotation.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateUserRequest {

    @NotBlank(message = "Vui lòng nhập họ tên")
    @Size(min = 3, max = 50, message = "Họ tên phải từ 3 đến 50 ký tự")
    @Pattern(
            regexp = "^[\\p{L}0-9._ ]+$",
            message = "Họ tên không được chứa ký tự đặc biệt"
    )
    private String userName;

    @NotBlank(message = "Vui lòng chọn giới tính")
    @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "Giới tính không hợp lệ")
    private String gender;

    @NotBlank(message = "Vui lòng nhập email")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Vui lòng nhập mật khẩu")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;

    @NotBlank(message = "Vui lòng nhập số điện thoại")
    @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại phải gồm 10 số và bắt đầu bằng 0")
    private String phone;

    @NotNull(message = "Vui lòng chọn ngày sinh")
    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Vui lòng chọn vai trò tài khoản")
    private String roleName;

    private String otp;

    @AssertTrue(message = "Bạn phải từ đủ 16 tuổi trở lên mới được đặt sân")
    public boolean isOldEnough() {
        if (dateOfBirth == null) {
            return true;
        }

        return !dateOfBirth.isAfter(LocalDate.now().minusYears(16));
    }
}
