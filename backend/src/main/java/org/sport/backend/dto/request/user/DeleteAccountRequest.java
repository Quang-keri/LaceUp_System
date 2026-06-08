package org.sport.backend.dto.request.user;



import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteAccountRequest {
    private String password;
    @Size(max = 200,
            message = "Lý do xóa không được vượt quá 200 ký tự")
    private String reason;
    @NotBlank(message = "Vui lòng nhập 'XOA' để xác nhận")
    private String confirmation;
}