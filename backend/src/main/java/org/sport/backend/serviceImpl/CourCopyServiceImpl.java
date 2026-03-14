package org.sport.backend.serviceImpl;

import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.dto.request.court_copy.CourtCopyRequest;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;
import org.sport.backend.entity.Court;
import org.sport.backend.entity.CourtCopy;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.repository.CourtCopyRepository;
import org.sport.backend.repository.CourtRepository;
import org.sport.backend.service.CourtCopyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CourCopyServiceImpl implements CourtCopyService {
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private CourtCopyRepository courtCopyRepository;

    @Override
    public CourtCopyResponse createCourt(CourtCopyRequest copyRequest) {

        Court court = courtRepository.findById(copyRequest.getCourtId())
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));

        CourtCopy courtCopy = CourtCopy.builder()
                .courtCode(copyRequest.getCourtCode())
                .courtCopyStatus(CourtCopyStatus.ACTIVE)
                .court(court)
                .build();

        courtCopyRepository.save(courtCopy);
        court.getCourtCopies().add(courtCopy);
        courtRepository.save(court);

        return CourtCopyResponse.builder()
                .courtCopyId(courtCopy.getCourtCopyId())
                .courtCode(courtCopy.getCourtCode())
                .status(courtCopy.getCourtCopyStatus())
                .build();
    }
}
