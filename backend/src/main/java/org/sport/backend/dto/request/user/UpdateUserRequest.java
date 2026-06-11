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
public class UpdateUserRequest {

    @Size(min = 3, max = 50, message = "Tên người dùng quá dài")
    private String userName;

    @Pattern(regexp = "^\\d{10}$", message = "Số điện thoại không đúng định dạng 10 số")
    private String phone;

    private String gender;

    @Past(message = "Ngày sinh phải là một ngày trong quá khứ")
    private LocalDate dateOfBirth;

    private String bankName;
    private String accountNumber;
    private String accountHolderName;
}
