package org.sport.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.sport.backend.dto.request.slot.SlotRequest;

import java.time.Duration;
import java.time.LocalDateTime;

public class SlotRequestValidator
        implements ConstraintValidator<ValidSlotRequest, SlotRequest> {

    @Override
    public boolean isValid(SlotRequest value, ConstraintValidatorContext context) {
        if (value == null) return true;

        boolean hasRoomId = value.getCourtId() != null;
        boolean hasRoomCopyId = value.getCourtCopyId() != null;
        if (!hasRoomId && !hasRoomCopyId) {
            replaceMessage(context, "Phải có courtId hoặc courtCopyId");
            return false;
        }


        LocalDateTime start = value.getStartTime();
        LocalDateTime end = value.getEndTime();

        if (start != null && end != null) {

            if (start.getMinute() % 30 != 0 || end.getMinute() % 30 != 0) {
                replaceMessage(context, "Thời gian đặt phải là mốc 30 phút (VD: 14:00, 14:30)");
                return false;
            }

            if (start.getSecond() != 0 || end.getSecond() != 0) {
                replaceMessage(context, "Thời gian không được chứa giây lẻ");
                return false;
            }

            long minutes = Duration.between(start, end).toMinutes();
            if (minutes < 60) {
                replaceMessage(context, "Thời gian thuê tối thiểu cho mỗi slot là 1 giờ");
                return false;
            }

            if (minutes > 480) {
                replaceMessage(context, "Không thể đặt quá 8 tiếng cho một lần thuê");
                return false;
            }

            if (start.isBefore(LocalDateTime.now())) {
                replaceMessage(context, "Không thể đặt phòng trong quá khứ");
                return false;
            }

            if (start.isAfter(LocalDateTime.now().plusDays(14))) {
                replaceMessage(context, "Chỉ được phép đặt trước tối đa 14 ngày");
                return false;
            }


        }

        return true;
    }


    private void replaceMessage(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    }
}