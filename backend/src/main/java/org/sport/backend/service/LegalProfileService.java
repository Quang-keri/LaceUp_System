package org.sport.backend.service;

import org.sport.backend.dto.request.legal.LegalProfileRequest;
import org.sport.backend.dto.response.legal.LegalProfileResponse;

import java.util.List;
import java.util.UUID;

public interface LegalProfileService
{
    LegalProfileResponse create(LegalProfileRequest req);
    LegalProfileResponse update(UUID id, LegalProfileRequest req);
    LegalProfileResponse get(UUID id);
    List<LegalProfileResponse> getAll();
}
