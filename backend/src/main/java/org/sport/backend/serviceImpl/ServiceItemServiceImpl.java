package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.request.serviceItem.ServiceItemRequest;
import org.sport.backend.dto.response.serviceItem.ServiceItemResponse;
import org.sport.backend.entity.ItemGroup;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.entity.ServiceItem;
import org.sport.backend.entity.ServiceItemImage;
import org.sport.backend.repository.ItemGroupRepository;
import org.sport.backend.repository.RentalAreaRepository;
import org.sport.backend.repository.ServiceItemRepository;
import org.sport.backend.service.CloudinaryService;
import org.sport.backend.service.ServiceItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ServiceItemServiceImpl implements ServiceItemService {

    @Autowired
    private ServiceItemRepository serviceItemRepository;

    @Autowired
    private ItemGroupRepository itemGroupRepo;

    @Autowired
    private RentalAreaRepository rentalAreaRepo;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Override
    @Transactional
    public ServiceItemResponse create(ServiceItemRequest req) {
        ItemGroup group = itemGroupRepo.findById(req.getItemGroupId())
                .orElseThrow(() -> new RuntimeException("ItemGroup not found"));

        RentalArea rentalArea = rentalAreaRepo.findById(req.getRentalAreaId())
                .orElseThrow(() -> new RuntimeException("RentalArea not found"));

        ServiceItem item = new ServiceItem();
        item.setServiceName(req.getServiceName());
        item.setQuantity(req.getQuantity());
        item.setRentalDuration(req.getRentalDuration());
        item.setPriceSell(req.getPriceSell());
        item.setPriceOriginal(req.getPriceOriginal());
        item.setServiceNote(req.getServiceNote());
        item.setItemGroup(group);
        item.setRentalArea(rentalArea);

        serviceItemRepository.save(item);

        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            String folder = "items/" + item.getServiceItemId();
            List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(req.getImageUrls(), folder);
            List<ServiceItemImage> images = new ArrayList<>();

            for (CloudinaryUploadResult u : uploaded) {
                ServiceItemImage img = new ServiceItemImage();
                img.setServiceItem(item);
                img.setImageUrl(u.getUrl());
                img.setPublicId(u.getPublicId());
                images.add(img);
            }
            item.setImages(images);
            serviceItemRepository.save(item);
        }

        return map(item);
    }

    @Override
    @Transactional
    public ServiceItemResponse update(UUID id, ServiceItemRequest req) {
        ServiceItem item = serviceItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ServiceItem not found"));

        ItemGroup group = itemGroupRepo.findById(req.getItemGroupId())
                .orElseThrow(() -> new RuntimeException("ItemGroup not found"));

        RentalArea rentalArea = rentalAreaRepo.findById(req.getRentalAreaId())
                .orElseThrow(() -> new RuntimeException("RentalArea not found"));

        item.setServiceName(req.getServiceName());
        item.setQuantity(req.getQuantity());
        item.setRentalDuration(req.getRentalDuration());
        item.setPriceSell(req.getPriceSell());
        item.setPriceOriginal(req.getPriceOriginal());
        item.setServiceNote(req.getServiceNote());
        item.setItemGroup(group);
        item.setRentalArea(rentalArea);
        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {

            for (ServiceItemImage oldImg : item.getImages()) {
                boolean isDeleted = cloudinaryService.deleteByPublicId(oldImg.getPublicId());

                if (isDeleted) {
                    System.out.println("Đã xóa ảnh trên Cloudinary thành công!");
                } else {
                    System.out.println("Xóa thất bại hoặc ảnh không tồn tại.");
                }
            }


            item.getImages().clear();

            String folder = "items/" + item.getServiceItemId();
            List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(req.getImageUrls(), folder);

            for (CloudinaryUploadResult u : uploaded) {
                ServiceItemImage img = new ServiceItemImage();
                img.setServiceItem(item);
                img.setImageUrl(u.getUrl());
                img.setPublicId(u.getPublicId());
                item.getImages().add(img);
            }
        }

        serviceItemRepository.save(item);
        return map(item);
    }

    @Override
    public ServiceItemResponse get(UUID id) {
        ServiceItem item = serviceItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ServiceItem not found"));
        return map(item);
    }

    @Override
    public List<ServiceItemResponse> getAll() {
        List<ServiceItem> items = serviceItemRepository.findAll();
        return items.stream().map(this::map).collect(Collectors.toList());

    }

    @Override
    public List<ServiceItemResponse> getByRentalArea(UUID rentalAreaId) {

        List<ServiceItem> items = serviceItemRepository
                .findByRentalArea_RentalAreaId(rentalAreaId);

        List <ServiceItemResponse> res = items.stream()
                .map(this::map)
                .collect(Collectors.toList());
        return  res;
    }

    private ServiceItemResponse map(ServiceItem item) {
        ServiceItemResponse res = new ServiceItemResponse();
        res.setId(item.getServiceItemId());
        res.setServiceName(item.getServiceName());
        res.setQuantity(item.getQuantity());
        res.setRentalDuration(item.getRentalDuration());
        res.setPriceSell(item.getPriceSell());
        res.setPriceOriginal(item.getPriceOriginal());
        res.setServiceNote(item.getServiceNote());

        if(item.getItemGroup() != null) {
            res.setItemGroupId(item.getItemGroup().getItemGroupId());
            res.setItemGroupName(item.getItemGroup().getName());
        }

        if(item.getRentalArea() != null) {
            res.setRentalAreaId(item.getRentalArea().getRentalAreaId());
        }

        List<String> imageUrls = new ArrayList<>();
        if (item.getImages() != null) {
            for (ServiceItemImage img : item.getImages()) {
                imageUrls.add(img.getImageUrl());
            }
        }
        res.setImages(imageUrls);

        return res;
    }
}