package org.sport.backend.service;

import org.sport.backend.dto.request.comission.CommissionConfigDTO;
import org.sport.backend.entity.CommissionConfig;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CommissionConfigService {
    CommissionConfig createConfig(CommissionConfigDTO dto);
    List<CommissionConfig> getAllConfigs();
    BigDecimal getApplicableRate(UUID rentalAreaId, int bookingCount);
}
