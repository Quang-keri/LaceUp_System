package org.sport.backend.ai.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.ai.service.KnowledgeService;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.entity.Court;
import org.sport.backend.entity.CourtPrice;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.repository.MatchRepository;
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
    private final MatchRepository matchRepository;

    private final JdbcTemplate jdbcTemplate;

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
        log.info("Xóa dữ liệu CƠ SỞ VẬT CHẤT (RentalArea) cũ trong Vector Store để tránh trùng lặp...");
        try {
            // Lưu ý: Lệnh TRUNCATE sẽ xóa SẠCH CẢ SÂN LẪN KÈO VÀ KIẾN THỨC.
            // Nếu bạn dùng lệnh này, bạn phải nạp lại toàn bộ.
            // Để tối ưu hơn, nếu dùng pgvector, ta nên dùng DELETE WHERE.
            jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'type' = 'RENTAL_AREA'");
        } catch (Exception e) {
            log.warn("Không thể xóa dữ liệu RENTAL_AREA cũ: {}", e.getMessage());
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

        String content = String.format(
                "Tại %s có cơ sở thể thao tên là %s. Địa chỉ cụ thể nằm ở %s, %s, %s. " +
                        "%s " +
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

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("type", "RENTAL_AREA"); // Bắt buộc để phân loại
        metadata.put("district", area.getAddress().getDistrict() != null ? area.getAddress().getDistrict() : "");

        if (hasPrice) {
            metadata.put("min_price", minPrice);
            metadata.put("max_price", maxPrice);
        }

        return new Document(area.getRentalAreaId().toString(), content, metadata);
    }

    @Transactional
    @Override
    public void trainAiWithAvailableMatches() {
        log.info("Xóa dữ liệu KÈO/TRẬN ĐẤU (Match) cũ trong Vector Store...");
        try {
            // Chỉ xóa các Document mang nhãn MATCH, giữ nguyên RENTAL_AREA
            jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'type' = 'MATCH'");
        } catch (Exception e) {
            log.warn("Lỗi khi dọn dẹp kèo cũ: {}", e.getMessage());
        }

        log.info("Bắt đầu quét danh sách kèo đang mở...");
        // Gọi hàm từ MatchRepository (Đảm bảo bạn đã định nghĩa hàm này bên MatchRepository)
        List<Match> availableMatches = matchRepository.findByStatus(MatchStatus.OPEN);

        if (availableMatches.isEmpty()) {
            log.info("Hiện không có kèo nào đang trống!");
            return;
        }

        List<Document> documents = availableMatches.stream()
                .map(this::convertMatchToDocument)
                .collect(Collectors.toList());

        vectorStore.add(documents);
        log.info("Đã nạp thành công {} kèo vào bộ nhớ AI!", documents.size());
    }

    private Document convertMatchToDocument(Match match) {
        String locationInfo;
        String districtForMetadata = "";
        String cityForMetadata = "";

        if (match.getCourt() != null && match.getCourt().getRentalArea() != null) {
            RentalArea area = match.getCourt().getRentalArea();
            locationInfo = String.format("đã chốt đá tại sân %s (%s, %s)",
                    area.getRentalAreaName(),
                    area.getAddress().getStreet(),
                    area.getAddress().getDistrict());
            districtForMetadata = area.getAddress().getDistrict();
            cityForMetadata = area.getAddress().getCity() != null ? area.getAddress().getCity().getCityName() : "";
        } else if (match.getAddress() != null) {
            locationInfo = String.format("đang tìm sân quanh khu vực %s, %s",
                    match.getAddress().getWard() != null ? match.getAddress().getWard() : "",
                    match.getAddress().getDistrict() != null ? match.getAddress().getDistrict() : "");
            districtForMetadata = match.getAddress().getDistrict() != null ? match.getAddress().getDistrict() : "";
            cityForMetadata = match.getAddress().getCity() != null ? match.getAddress().getCity().getCityName() : "";
        } else {
            locationInfo = "chưa chốt địa điểm cụ thể";
        }

        int missingPlayers = (match.getMaxPlayers() != null && match.getCurrentPlayers() != null)
                ? Math.max(0, match.getMaxPlayers() - match.getCurrentPlayers())
                : 0;

        String content = String.format(
                "Cộng đồng LaceUP đang có một kèo %s %s. " +
                        "Trận đấu dự kiến diễn ra từ %s đến %s. Địa điểm: %s. " +
                        "Hiện tại kèo đang cần tuyển thêm %d người chơi. " +
                        "Thể thức: %s. %s " +
                        "Host (Chủ kèo): %s. Mọi người có thể vào mục Cộng Đồng trên App để đăng ký tham gia nhé!",
                match.getCategory() != null ? match.getCategory().getCategoryName() : "thể thao",
                match.getMatchType() != null ? match.getMatchType().toString() : "giao lưu",
                match.getStartTime() != null ? match.getStartTime().toLocalTime().toString() : "đang cập nhật",
                match.getEndTime() != null ? match.getEndTime().toLocalTime().toString() : "đang cập nhật",
                locationInfo,
                missingPlayers,
                match.getMatchType() != null ? match.getMatchType().toString() : "",
                match.getNote() != null && !match.getNote().isBlank() ? "Ghi chú từ chủ kèo: " + match.getNote() : "",
                match.getHost() != null ? match.getHost().getUserName() : "Người dùng ẩn danh"
        );

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("type", "MATCH"); // Bắt buộc để phân loại
        metadata.put("category", match.getCategory() != null ? match.getCategory().getCategoryName() : "");
        if (!districtForMetadata.isBlank()) metadata.put("district", districtForMetadata);
        if (!cityForMetadata.isBlank()) metadata.put("city", cityForMetadata);

        return new Document(match.getMatchId().toString(), content, metadata);
    }

    @Override
    public void resetAiMemory() {
        log.info("Xóa toàn bộ dữ liệu trong Vector Store...");
        jdbcTemplate.execute("TRUNCATE TABLE vector_store");
    }
}