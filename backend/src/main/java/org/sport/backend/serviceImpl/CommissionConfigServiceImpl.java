package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.request.comission.CommissionConfigDTO;
import org.sport.backend.dto.response.comission.CommissionConfigResponse;
import org.sport.backend.entity.CommissionConfig;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.repository.CommissionConfigRepository;
import org.sport.backend.repository.RentalAreaRepository;
import org.sport.backend.service.CommissionConfigService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    @Transactional
    public CommissionConfigResponse createConfig(CommissionConfigDTO dto) {

        boolean isDefault = Boolean.TRUE.equals(dto.getIsDefault());

        if (isDefault) {
            configRepo.findByIsDefaultTrue().ifPresent(oldDefault -> {
                oldDefault.setIsDefault(false);
                oldDefault.setIsActive(false);
                configRepo.save(oldDefault);
            });
        }

        RentalArea rentalArea = null;

        if (!isDefault) {
            if (dto.getRentalAreaId() == null) {
                throw new RuntimeException("Vui lòng chọn tòa nhà/khu sân khi cấu hình riêng");
            }

            configRepo.findFirstByRentalArea_RentalAreaIdAndIsActiveTrue(dto.getRentalAreaId())
                    .ifPresent(oldConfig -> {
                        throw new RuntimeException("Khu sân này đã có cấu hình hoa hồng riêng");
                    });

            rentalArea = rentalAreaRepository.findById(dto.getRentalAreaId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tòa nhà/khu sân"));
        }

        CommissionConfig config = CommissionConfig.builder()
                .rentalArea(rentalArea)
                .minBookings(dto.getMinBookings())
                .maxBookings(dto.getMaxBookings())
                .rate(dto.getRate() != null ? dto.getRate() : BigDecimal.ZERO)
                .isDefault(isDefault)
                .isActive(true)
                .note(dto.getNote())
                .build();

        CommissionConfig saved = configRepo.save(config);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CommissionConfigResponse updateConfig(UUID configId, CommissionConfigDTO dto) {
        CommissionConfig config = configRepo.findById(configId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cấu hình hoa hồng"));

        boolean isDefault = Boolean.TRUE.equals(dto.getIsDefault());

        if (isDefault) {
            configRepo.findByIsDefaultTrue().ifPresent(oldDefault -> {
                if (!oldDefault.getCommissionConfigId().equals(configId)) {
                    oldDefault.setIsDefault(false);
                    oldDefault.setIsActive(false);
                    configRepo.save(oldDefault);
                }
            });

            config.setRentalArea(null);
            config.setIsDefault(true);
        } else {
            if (dto.getRentalAreaId() == null) {
                throw new RuntimeException("Vui lòng chọn tòa nhà/khu sân khi cấu hình riêng");
            }

            configRepo.findFirstByRentalArea_RentalAreaIdAndIsActiveTrue(dto.getRentalAreaId())
                    .ifPresent(oldConfig -> {
                        if (!oldConfig.getCommissionConfigId().equals(configId)) {
                            throw new RuntimeException("Khu sân này đã có cấu hình hoa hồng riêng");
                        }
                    });

            RentalArea rentalArea = rentalAreaRepository.findById(dto.getRentalAreaId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tòa nhà/khu sân"));

            config.setRentalArea(rentalArea);
            config.setIsDefault(false);
        }

        config.setMinBookings(dto.getMinBookings());
        config.setMaxBookings(dto.getMaxBookings());
        config.setRate(dto.getRate() != null ? dto.getRate() : BigDecimal.ZERO);
        config.setIsActive(true);
        config.setNote(dto.getNote());

        CommissionConfig saved = configRepo.save(config);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommissionConfigResponse> getAllConfigs() {
        return configRepo.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getApplicableRate(UUID rentalAreaId, int bookingCount) {
        Optional<CommissionConfig> specificConfig =
                configRepo.findApplicableConfigForRentalArea(rentalAreaId, bookingCount);

        if (specificConfig.isPresent()) {
            return specificConfig.get().getRate();
        }

        return configRepo.findByIsDefaultTrue()
                .map(CommissionConfig::getRate)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getApplicableRate(UUID rentalAreaId) {
        Optional<CommissionConfig> specificConfig =
                configRepo.findFirstByRentalArea_RentalAreaIdAndIsActiveTrue(rentalAreaId);

        if (specificConfig.isPresent()) {
            return specificConfig.get().getRate();
        }

        return configRepo.findByIsDefaultTrue()
                .map(CommissionConfig::getRate)
                .orElse(BigDecimal.ZERO);
    }

    private CommissionConfigResponse mapToResponse(CommissionConfig config) {
        RentalArea rentalArea = config.getRentalArea();

        return CommissionConfigResponse.builder()
                .commissionConfigId(config.getCommissionConfigId())
                .rentalAreaId(
                        rentalArea != null
                                ? rentalArea.getRentalAreaId()
                                : null
                )
                .rentalAreaName(
                        rentalArea != null
                                ? rentalArea.getRentalAreaName()
                                : null
                )
                .minBookings(config.getMinBookings())
                .maxBookings(config.getMaxBookings())
                .rate(config.getRate())
                .isDefault(config.getIsDefault())
                .isActive(config.getIsActive())
                .note(config.getNote())
                .build();
    }
}