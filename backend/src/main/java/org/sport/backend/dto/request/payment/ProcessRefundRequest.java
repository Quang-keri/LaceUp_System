package org.sport.backend.dto.request.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ProcessRefundRequest {

    @NotNull(message = "Kết quả xử lý không được để trống")
    private Boolean success;

    @Size(
            max = 1000,
            message = "Ghi chú không được vượt quá 1000 ký tự"
    )
    private String note;
}