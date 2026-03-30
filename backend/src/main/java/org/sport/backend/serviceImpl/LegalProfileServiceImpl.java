package org.sport.backend.serviceImpl;

import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.request.legal.LegalProfileRequest;
import org.sport.backend.dto.response.legal.LegalProfileResponse;
import org.sport.backend.entity.LegalImage;
import org.sport.backend.entity.LegalProfile;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.repository.LegalProfileRepository;
import org.sport.backend.repository.RentalAreaRepository;
import org.sport.backend.service.CloudinaryService;
import org.sport.backend.service.LegalProfileService;
import org.sport.backend.service.RentalAreaService;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LegalProfileServiceImpl implements LegalProfileService {

    @Autowired
    private LegalProfileRepository repo;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private RentalAreaRepository rentalAreaRepo;

    @Override
    @Transactional
    public LegalProfileResponse create(LegalProfileRequest req) {
        RentalArea rentalArea = rentalAreaRepo.findById(req.getRentalAreaId())
                .orElseThrow(() -> new RuntimeException("RentalArea not found"));

        LegalProfile profile = new LegalProfile();
        profile.setBusinessLicenseNumber(req.getBusinessLicenseNumber());
        profile.setTaxId(req.getTaxId());
        profile.setLegalNote(req.getLegalNote());
        profile.setRentalArea(rentalArea);
        repo.save(profile);


        if (req.getImageFiles() != null && !req.getImageFiles().isEmpty()) {
            String folder = "legals/" + profile.getId();

            List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(req.getImageFiles(), folder);
            List<LegalImage> images = new ArrayList<>();

            for (CloudinaryUploadResult u : uploaded) {
                LegalImage img = new LegalImage();
                img.setLegalProfile(profile);
                img.setImageUrl(u.getUrl());
                img.setPublicId(u.getPublicId());
                images.add(img);
            }

            profile.setImages(images);
            repo.save(profile);
        }

        return map(profile);
    }

    @Override
    @Transactional
    public LegalProfileResponse update(UUID id, LegalProfileRequest req) {
        LegalProfile profile = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("LegalProfile not found"));

        profile.setBusinessLicenseNumber(req.getBusinessLicenseNumber());
        profile.setTaxId(req.getTaxId());
        profile.setLegalNote(req.getLegalNote());


        if (req.getImageFiles() != null && !req.getImageFiles().isEmpty()) {


            if (profile.getImages() != null) {
                for (LegalImage oldImg : profile.getImages()) {
                    if (oldImg.getPublicId() != null) {
                        cloudinaryService.deleteByPublicId(oldImg.getPublicId());
                    }
                }
                profile.getImages().clear();
            }


            String folder = "legals/" + profile.getId();
            List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(req.getImageFiles(), folder);

            for (CloudinaryUploadResult u : uploaded) {
                LegalImage img = new LegalImage();
                img.setLegalProfile(profile);
                img.setImageUrl(u.getUrl());
                img.setPublicId(u.getPublicId());
                profile.getImages().add(img);
            }
        }

        repo.save(profile);
        return map(profile);
    }

    @Override
    public LegalProfileResponse get(UUID id) {
        LegalProfile profile = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("LegalProfile not found"));
        return map(profile);
    }

    @Override
    public List<LegalProfileResponse> getAll() {
        return repo.findAll().stream()
                .map(this::map)
                .collect(Collectors.toList());
    }


    private LegalProfileResponse map(LegalProfile profile) {
        LegalProfileResponse res = new LegalProfileResponse();
        res.setId(profile.getId());
        res.setBusinessLicenseNumber(profile.getBusinessLicenseNumber());
        res.setTaxId(profile.getTaxId());
        res.setLegalNote(profile.getLegalNote());
            if(profile.getRentalArea() != null) {
                res.setRentalAreaId(profile.getRentalArea().getRentalAreaId());
            }
        List<String> imageUrls = new ArrayList<>();
        if (profile.getImages() != null) {
            for (LegalImage img : profile.getImages()) {
                imageUrls.add(img.getImageUrl());
            }
        }
        res.setImages(imageUrls);

        return res;
    }
}