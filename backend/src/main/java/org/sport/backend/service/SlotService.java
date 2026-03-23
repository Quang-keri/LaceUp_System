package org.sport.backend.service;

import org.sport.backend.dto.request.slot.ExtendRequest;
import org.sport.backend.dto.request.slot.SwapRequest;
import org.sport.backend.dto.response.court.CourtResponse;
import org.sport.backend.dto.response.slot.ExtendCheckResponse;
import org.sport.backend.dto.response.slot.SwapCheckResponse;

import java.util.List;
import java.util.UUID;

public interface SlotService {
    List<CourtResponse> getCourtsByRental(UUID rentalAreaId);
    ExtendCheckResponse checkExtend(UUID slotId, ExtendRequest req);
    void confirmExtend(UUID slotId, ExtendRequest req);
    SwapCheckResponse checkSwap(UUID slotId, SwapRequest req);
    void confirmSwap(UUID slotId, SwapRequest req);
}
