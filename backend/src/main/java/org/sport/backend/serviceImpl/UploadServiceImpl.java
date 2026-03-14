package org.sport.backend.serviceImpl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.sport.backend.properties.CloudinaryProperties;
import org.sport.backend.service.UploadService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UploadServiceImpl implements UploadService {

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    @Override
    public Map uploadImage(MultipartFile file) throws IOException {
        // Cấu hình folder lưu trữ từ properties
        Map params = ObjectUtils.asMap(
                "folder", properties.getFolder(),
                "resource_type", "auto"
        );

        // Thực hiện upload
        return cloudinary.uploader().upload(file.getBytes(), params);
    }
}