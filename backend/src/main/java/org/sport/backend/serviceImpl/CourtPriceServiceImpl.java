package org.sport.backend.serviceImpl;

import org.sport.backend.constant.PriceType;
import org.sport.backend.dto.request.court_price.CourtPriceRequest;
import org.sport.backend.dto.response.court_price.CourtPriceResponse;
import org.sport.backend.entity.Court;
import org.sport.backend.entity.CourtCopy;
import org.sport.backend.entity.CourtPrice;
import org.sport.backend.repository.CourtPriceRepository;
import org.sport.backend.repository.CourtRepository;
import org.sport.backend.service.CourtPriceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class CourtPriceServiceImpl implements CourtPriceService {

    @Autowired
    private CourtPriceRepository courtPriceRepository;
    @Autowired
    private CourtRepository courtRepository;

    @Override
    public CourtPriceResponse create(CourtPriceRequest request) {

        Court court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new RuntimeException("Court not found"));

        CourtPrice price = CourtPrice.builder()
                .court(court)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .pricePerHour(request.getPricePerHour())
                .specificDate(request.getSpecificDate())
                .priceType(request.getPriceType())
                .priority(request.getPriority())
                .build();

        return mapToResponse(courtPriceRepository.save(price));
    }

    @Override
    public List<CourtPriceResponse> getByCourt(UUID courtId) {

        return courtPriceRepository.findByCourt_CourtId(courtId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CourtPriceResponse update(UUID id, CourtPriceRequest request) {

        CourtPrice price = courtPriceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourtPrice not found"));

        if (request.getStartTime() != null) price.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) price.setEndTime(request.getEndTime());
        if (request.getPricePerHour() != null) price.setPricePerHour(request.getPricePerHour());
        if (request.getSpecificDate() != null) price.setSpecificDate(request.getSpecificDate());
        if (request.getPriceType() != null) price.setPriceType(request.getPriceType());
        if (request.getPriority() != null) price.setPriority(request.getPriority());

        return mapToResponse(courtPriceRepository.save(price));
    }

    @Override
    public void delete(UUID id) {
        courtPriceRepository.deleteById(id);
    }

    private CourtPriceResponse mapToResponse(CourtPrice p) {
        return CourtPriceResponse.builder()
                .courtPriceId(p.getCourtPriceId())
                .courtId(p.getCourt().getCourtId())
                .startTime(p.getStartTime())
                .endTime(p.getEndTime())
                .pricePerHour(p.getPricePerHour())
                .specificDate(p.getSpecificDate())
                .priceType(p.getPriceType())
                .priority(p.getPriority())
                .build();
    }

    @Override
    public BigDecimal calculatePrice(CourtCopy courtCopy,
                                     LocalDateTime slotStart,
                                     LocalDateTime slotEnd) {

        UUID courtId = courtCopy.getCourt().getCourtId();
        List<CourtPrice> prices = courtPriceRepository
                .findByCourtIdOrderByPriorityDesc(courtId);

        if (prices.isEmpty()) {
            return BigDecimal.ZERO;
        }


        BigDecimal totalPrice = BigDecimal.ZERO;
        LocalDateTime cursor = slotStart;

        while (cursor.isBefore(slotEnd)) {
            LocalDateTime nextMinute = cursor.plusMinutes(1);


            BigDecimal pricePerHour = findBestPrice(prices, cursor);

            BigDecimal pricePerMinute = pricePerHour
                    .divide(BigDecimal.valueOf(60), 10, RoundingMode.HALF_UP);

            totalPrice = totalPrice.add(pricePerMinute);
            cursor = nextMinute;
        }

        return totalPrice.setScale(0, RoundingMode.HALF_UP);
    }


    private BigDecimal findBestPrice(List<CourtPrice> prices, LocalDateTime moment) {
        LocalTime time = moment.toLocalTime();
        LocalDate date = moment.toLocalDate();
        DayOfWeek dow  = date.getDayOfWeek();

        for (CourtPrice cp : prices) {
            if (!isTimeInRange(time, cp.getStartTime(), cp.getEndTime())) {
                continue;
            }

            switch (cp.getPriceType()) {

                case NORMAL -> {
                    return cp.getPricePerHour();
                }

                case WEEKEND -> {
                    if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
                        return cp.getPricePerHour();
                    }
                }

                case PEAK -> {
                    return cp.getPricePerHour();
                }

                case HOLIDAY, EVENT -> {

                    if (cp.getSpecificDate() != null && cp.getSpecificDate().equals(date)) {
                        return cp.getPricePerHour();
                    }
                }

                case OTHER -> {
                    if (cp.getSpecificDate() == null
                            || cp.getSpecificDate().equals(date)) {
                        return cp.getPricePerHour();
                    }
                }
            }
        }


        return prices.stream()
                .filter(cp -> cp.getPriceType() == PriceType.NORMAL)
                .map(CourtPrice::getPricePerHour)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }


    private boolean isTimeInRange(LocalTime time, LocalTime start, LocalTime end) {
        if (start == null || end == null) return true; // null = áp dụng cả ngày

        if (start.isBefore(end)) {
            // Range bình thường: 08:00 - 22:00
            return !time.isBefore(start) && time.isBefore(end);
        } else {
            // Overnight: 22:00 - 02:00
            return !time.isBefore(start) || time.isBefore(end);
        }
    }
}