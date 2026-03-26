package org.sport.backend.ai.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.ai.service.KnowledgeService;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.repository.RentalAreaRepository;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeServiceImpl implements KnowledgeService {

    private final VectorStore vectorStore;
    private final RentalAreaRepository rentalAreaRepository;

    @Override
    public void importTextData(String text) {
        if (text == null || text.isBlank()) return;
        Document document = new Document(text);
        TokenTextSplitter splitter = new TokenTextSplitter();
        List<Document> chunks = splitter.apply(List.of(document));
        vectorStore.add(chunks);
    }

    @Transactional
    @Override
    public void trainAiWithRentalAreas() {
        log.info("Bắt đầu quá trình nạp dữ liệu sân vào AI...");
        List<RentalArea> areas = rentalAreaRepository.findAll();

        if (areas.isEmpty()) {
            log.warn("Không có dữ liệu sân để nạp!");
            return;
        }

        List<Document> documents = areas.stream()
                .map(this::convertToDocument)
                .collect(Collectors.toList());

        vectorStore.add(documents);
        log.info("Đã nạp thành công {} sân vào bộ nhớ AI!", documents.size());
    }

    private Document convertToDocument(RentalArea area) {
        // Xử lý dữ liệu null để tránh AI trả về chữ "null" cho khách hàng
        String name = area.getRentalAreaName();
        String street = (area.getAddress() != null) ? area.getAddress().getStreet() : "đang cập nhật";
        String ward = (area.getAddress() != null) ? area.getAddress().getWard() : "";
        String district = (area.getAddress() != null) ? area.getAddress().getDistrict() : "";
        String city = (area.getAddress() != null && area.getAddress().getCity() != null)
                ? area.getAddress().getCity().getCityName() : "";

        String contact = (area.getContactPhone() != null) ? area.getContactPhone() : "liên hệ qua ứng dụng";
        String openTime = (area.getOpenTime() != null) ? area.getOpenTime().toString() : "05:00";
        String closeTime = (area.getCloseTime() != null) ? area.getCloseTime().toString() : "22:00";

        // Xây dựng câu văn hoàn chỉnh - AI học theo ngữ cảnh rất tốt
        String content = String.format(
                "Sân bóng: %s. Địa chỉ: %s %s %s %s. " +
                        "Thông tin liên hệ: %s. Giờ mở cửa hàng ngày: %s - %s. " +
                        "Lưu ý: Sân hiện đang trong trạng thái %s.",
                name, street, ward, district, city,
                contact, openTime, closeTime, area.getStatus()
        );

        // Metadata để sau này dùng Filter lọc chính xác theo quận/thành phố
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("id", area.getRentalAreaId().toString());
        metadata.put("type", "RENTAL_AREA");
        if (!district.isBlank()) metadata.put("district", district);
        if (!city.isBlank()) metadata.put("city", city);

        return new Document(content, metadata);
    }

    @Override
    public void resetAiMemory() {
        log.info("Xóa dữ liệu cũ trong Vector Store...");
        // Lưu ý: Hiện tại Spring AI chưa hỗ trợ lệnh clear() trực tiếp trên interface VectorStore
        // Bạn có thể dùng JdbcTemplate để truncate table: "TRUNCATE TABLE vector_store"
    }
}