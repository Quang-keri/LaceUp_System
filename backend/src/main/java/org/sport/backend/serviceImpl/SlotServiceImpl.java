package org.sport.backend.serviceImpl;

import org.sport.backend.dto.request.slot.ExtendRequest;
import org.sport.backend.dto.request.slot.SwapRequest;
import org.sport.backend.dto.response.court.CourtResponse;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;
import org.sport.backend.dto.response.court_price.CourtPriceResponse;
import org.sport.backend.dto.response.slot.ExtendCheckResponse;
import org.sport.backend.dto.response.slot.SwapCheckResponse;
import org.sport.backend.entity.*;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.repository.*;
import org.sport.backend.service.CourtPriceService;
import org.sport.backend.service.SlotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SlotServiceImpl implements SlotService {


    @Autowired
    private SlotRepository slotRepository;
    @Autowired
    private CourtCopyRepository courtCopyRepository;
    @Autowired
    private CourtPriceService courtPriceService;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private RentalAreaRepository rentalAreaRepository;
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private CourtPriceRepository courtPriceRepository;

    public List<CourtResponse> getCourtsByRental(UUID rentalAreaId) {

        RentalArea rentalArea = rentalAreaRepository.findById(rentalAreaId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_AREA_NOT_FOUND));

        List<Court> courts = courtRepository.findByRentalArea(rentalArea);

        List<CourtResponse> courtResponses = courts.stream().map(court -> {

            List<Object[]> result = courtPriceRepository.getPriceRange(court.getCourtId());

            BigDecimal minPrice = null;
            BigDecimal maxPrice = null;

            if (result != null && !result.isEmpty()) {
                Object[] range = result.get(0);

                minPrice = range[0] != null ? (BigDecimal) range[0] : null;
                maxPrice = range[1] != null ? (BigDecimal) range[1] : null;
            }
            List<CourtCopy> courtCopies =
                    courtCopyRepository.findByCourt_CourtId(court.getCourtId());

            List<CourtCopyResponse> courtCopyResponses = courtCopies.stream()
                    .map(cc -> CourtCopyResponse.builder()
                            .courtCopyId(cc.getCourtCopyId())
                            .courtCode(cc.getCourtCode())
                            .status(cc.getCourtCopyStatus())
                            .build()
                    ).toList();

            return CourtResponse.builder()
                    .courtId(court.getCourtId())
                    .courtName(court.getCourtName())
                    .minPrice(minPrice)
                    .maxPrice(maxPrice)
                    .courtCopies(courtCopyResponses)
                    .build();

        }).toList();


        return courtResponses;
    }


    public ExtendCheckResponse checkExtend(UUID slotId, ExtendRequest req) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_FOUND));

        LocalDateTime newEnd = computeNewEnd(slot.getEndTime(), req);


        boolean conflict = slotRepository.existsConflictSlot(
                slot.getCourtCopy().getCourtCopyId(),
                slot.getEndTime(),
                newEnd,
                slotId
        );

        if (conflict) {
            return ExtendCheckResponse.builder()
                    .available(false)
                    .conflictReason("Khung giờ gia hạn đã có người đặt")
                    .build();
        }


        long addedMinutes = req.getUnit().equals("hour")
                ? req.getAmount() * 60L : req.getAmount();
        BigDecimal extraPrice = courtPriceService.calculatePrice(
                slot.getCourtCopy(), slot.getEndTime(), newEnd);

        return ExtendCheckResponse.builder()
                .available(true)
                .extraPrice(extraPrice)
                .newEndTime(newEnd)
                .build();
    }

    public void confirmExtend(UUID slotId, ExtendRequest req) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_FOUND));

        LocalDateTime newEnd = computeNewEnd(slot.getEndTime(), req);


        boolean conflict = slotRepository.existsConflictSlot(
                slot.getCourtCopy().getCourtCopyId(),
                slot.getEndTime(), newEnd, slotId);
        if (conflict) throw new AppException(ErrorCode.SLOT_CONFLICT);

        BigDecimal extraPrice = courtPriceService.calculatePrice(
                slot.getCourtCopy(), slot.getEndTime(), newEnd);

        slot.setEndTime(newEnd);
        slot.setPrice(slot.getPrice().add(extraPrice));
        slotRepository.save(slot);


        updateBookingTotal(slot.getBooking());
    }

    public SwapCheckResponse checkSwap(UUID slotId, SwapRequest req) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_FOUND));

        // 1. Backend TỰ ĐỘNG ép buộc thời gian mới = thời lượng cũ
        long oldDuration = ChronoUnit.MINUTES.between(slot.getStartTime(), slot.getEndTime());
        LocalDateTime newEnd = req.getNewStartTime().plusMinutes(oldDuration);

        // 2. Check trùng lịch với khung giờ mới (đã được fix cứng thời lượng)
        boolean conflict = slotRepository.existsConflictSlot(
                req.getCourtCopyId(), req.getNewStartTime(), newEnd, slotId
        );

        if (conflict) {
            return SwapCheckResponse.builder()
                    .available(false)
                    .conflictReason("Sân/giờ này đã có người đặt")
                    .build();
        }

        // 3. Trả về đúng giá cũ, độ chênh lệch tiền = 0
        return SwapCheckResponse.builder()
                .available(true)
                .newPrice(slot.getPrice())
                .priceDiff(BigDecimal.ZERO)
                .build();
    }

    public void confirmSwap(UUID slotId, SwapRequest req) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.SLOT_NOT_FOUND));

        long durationMinutes = ChronoUnit.MINUTES.between(slot.getStartTime(), slot.getEndTime());
        LocalDateTime newEnd = req.getNewStartTime().plusMinutes(durationMinutes);

        CourtCopy targetCourt = courtCopyRepository.findById(req.getCourtCopyId())
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));


        boolean conflict = slotRepository.existsConflictSlot(
                req.getCourtCopyId(), req.getNewStartTime(), newEnd, slotId);
        if (conflict) throw new AppException(ErrorCode.SLOT_CONFLICT);


        slot.setCourtCopy(targetCourt);
        slot.setStartTime(req.getNewStartTime());
        slot.setEndTime(newEnd);

        slotRepository.save(slot);
    }


    private LocalDateTime computeNewEnd(LocalDateTime endTime, ExtendRequest req) {
        return req.getUnit().equals("hour")
                ? endTime.plusHours(req.getAmount())
                : endTime.plusMinutes(req.getAmount());
    }

    private void updateBookingTotal(Booking booking) {
        BigDecimal total = booking.getSlots().stream()
                .map(Slot::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        booking.setTotalPrice(total);
        bookingRepository.save(booking);
    }
}
