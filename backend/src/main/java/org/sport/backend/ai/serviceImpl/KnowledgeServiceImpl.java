package org.sport.backend.ai.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.ai.service.KnowledgeService;
import org.sport.backend.entity.Court;
import org.sport.backend.entity.CourtPrice;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.repository.RentalAreaRepository;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate; // Thêm JdbcTemplate để xóa data cũ

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
        log.info("Xóa dữ liệu cũ trong Vector Store để tránh trùng lặp...");
        try {
            // Xóa sạch não bộ cũ trước khi nạp mới (Giải quyết triệt để lỗi hiện 2 sân giống nhau)
            jdbcTemplate.execute("TRUNCATE TABLE vector_store");
        } catch (Exception e) {
            log.warn("Không thể Truncate bảng vector_store: {}", e.getMessage());
        }

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
        // 1. Logic tìm Giá thấp nhất và Giá cao nhất của khu sân
        double minPrice = Double.MAX_VALUE;
        double maxPrice = 0;
        boolean hasPrice = false;

        if (area.getCourts() != null) {
            for (Court court : area.getCourts()) {
                if (court.getCourtPrices() != null) {
                    for (CourtPrice price : court.getCourtPrices()) {
                        if (price.getPricePerHour() != null) {
                            double val = price.getPricePerHour().doubleValue();
                            if (val < minPrice) minPrice = val;
                            if (val > maxPrice) maxPrice = val;
                            hasPrice = true;
                        }
                    }
                }
            }
        }

        String priceInfo = hasPrice
                ? String.format("Giá thuê dao động từ %,.0f VNĐ đến %,.0f VNĐ mỗi giờ.", minPrice, maxPrice)
                : "Giá thuê: Hiện chưa có thông tin giá cụ thể, vui lòng liên hệ.";

        // 2. Tạo nội dung nạp vào AI thật chi tiết (Đã ghép thêm giá)
        String content = String.format(
                "Tại %s có sân bóng tên là %s. Địa chỉ cụ thể nằm ở %s, %s, %s. " +
                        "%s " + // Chèn câu thông tin giá vào đây
                        "Khách hàng có nhu cầu đặt sân tại %s vui lòng liên hệ %s.",
                area.getAddress().getDistrict(),
                area.getRentalAreaName(),
                area.getAddress().getStreet(),
                area.getAddress().getWard(),
                area.getAddress().getDistrict(),
                priceInfo,
                area.getAddress().getDistrict(),
                area.getContactPhone() != null ? area.getContactPhone() : "Hotline hệ thống"
        );

        // 3. Metadata quan trọng để lọc
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("type", "RENTAL_AREA");
        metadata.put("district", area.getAddress().getDistrict() != null ? area.getAddress().getDistrict() : "");

        // Thêm metadata về giá để AI có thể so sánh toán học (ví dụ: "tìm sân dưới 100k")
        if (hasPrice) {
            metadata.put("min_price", minPrice);
            metadata.put("max_price", maxPrice);
        }

        // Truyền thẳng ID của RentalArea làm ID của Document.
        return new Document(area.getRentalAreaId().toString(), content, metadata);
    }

    @Override
    public void resetAiMemory() {
        log.info("Xóa dữ liệu cũ trong Vector Store...");
        jdbcTemplate.execute("TRUNCATE TABLE vector_store");
    }
}