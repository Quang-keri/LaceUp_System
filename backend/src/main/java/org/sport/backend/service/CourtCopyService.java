package org.sport.backend.service;

import org.sport.backend.dto.request.court_copy.CourtCopyRequest;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;

public interface CourtCopyService {

 CourtCopyResponse createCourt(CourtCopyRequest copyRequest);
}
