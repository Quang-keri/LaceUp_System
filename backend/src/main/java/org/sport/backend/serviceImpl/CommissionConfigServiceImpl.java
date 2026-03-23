package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.request.comission.CommissionConfigDTO;
import org.sport.backend.entity.CommissionConfig;
import org.sport.backend.repository.CommissionConfigRepository;
import org.sport.backend.repository.RentalAreaRepository;
import org.sport.backend.service.CommissionConfigService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommissionConfigServiceImpl implements CommissionConfigService {

    private final CommissionConfigRepository configRepo;
        private final RentalAreaRepository rentalAreaRepository;


    @Override
    public CommissionConfig createConfig(CommissionConfigDTO dto) {
        // Nếu set là default, vô hiệu hóa default cũ (tùy logic business của bạn)
        if (Boolean.TRUE.equals(dto.getIsDefault())) {
            configRepo.findByIsDefaultTrue().ifPresent(oldDefault -> {
                oldDefault.setIsDefault(false);
                configRepo.save(oldDefault);
            });
        }

        CommissionConfig config = CommissionConfig.builder()
                 .rentalArea(rentalAreaRepository.findById(dto.getRentalAreaId()).orElse(null))
                .minBookings(dto.getMinBookings())
                .maxBookings(dto.getMaxBookings())
                .rate(dto.getRate() != null ? dto.getRate() : BigDecimal.ZERO)
                .isDefault(dto.getIsDefault() != null ? dto.getIsDefault() : false)
                .note(dto.getNote())
                .build();
        return configRepo.save(config);
    }

    @Override
    public List<CommissionConfig> getAllConfigs() {
        return configRepo.findAll();
    }

    @Override
    public BigDecimal getApplicableRate(UUID rentalAreaId, int bookingCount) {
        // 1. Tìm cấu hình riêng cho tòa nhà này dựa trên số lượng booking đạt được
        Optional<CommissionConfig> specificConfig = configRepo.findApplicableConfigForRentalArea(rentalAreaId, bookingCount);
        if (specificConfig.isPresent()) {
            return specificConfig.get().getRate();
        }

        Optional<CommissionConfig> defaultConfig = configRepo.findByIsDefaultTrue();
        return defaultConfig.map(CommissionConfig::getRate).orElse(BigDecimal.ZERO);
    }
}
