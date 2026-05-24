package org.sport.backend.ai.serviceImpl;

import lombok.extern.slf4j.Slf4j;
import org.sport.backend.ai.service.ChatbotService;
import org.sport.backend.properties.ChatBoxProperties;
import org.sport.backend.properties.UrlProperties;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ChatbotServiceImpl implements ChatbotService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    private final ChatBoxProperties chatBoxProperties;
    private final UrlProperties urlProperties;

    public ChatbotServiceImpl(
            ChatClient.Builder builder, VectorStore vectorStore, ChatBoxProperties chatBoxProperties, UrlProperties urlProperties) {
        this.chatClient = builder.build();
        this.vectorStore = vectorStore;
        this.chatBoxProperties = chatBoxProperties;
        this.urlProperties = urlProperties;
    }

    @Override
    public String askAI(String userMessage) {
        // 1. Retrieval
        List<Document> similarDocuments = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(userMessage)
                        .topK(chatBoxProperties.getTopK())
                        .similarityThreshold(chatBoxProperties.getThreshold())
                        .build()
        );

        // 2. Kiểm tra và gom ngữ cảnh
        String context;
        if (similarDocuments.isEmpty()) {
            context = "Không có dữ liệu cụ thể về vấn đề này trong hệ thống LaceUP.";
        } else {
            context = similarDocuments.stream()
                    .map(Document::getText)
                    .collect(Collectors.joining(System.lineSeparator()));
        }

        // 3. Generation
        // CẬP NHẬT LẠI PROMPT: Bổ sung luật xử lý câu hỏi về Đánh giá / Rating
        String SUPPORT_EMAIL = "werelacezone@gmail.com";
        String finalPrompt = String.format(
                """
                        Hệ thống: Bạn là trợ lý ảo của LaceUP (Nền tảng đặt sân thể thao). Bạn được cung cấp các dữ liệu sau từ hệ thống: [%s].
                        
                        Yêu cầu bắt buộc đối với bạn:
                        - CHỈ trả lời các vấn đề liên quan đến thể thao, tìm sân, đặt sân và các dịch vụ của LaceUP.
                        - NẾU KHÁCH HỎI LẠC ĐỀ (ví dụ: mua bán lốp xe, thời tiết, v.v.), BẠN PHẢI TỪ CHỐI LỊCH SỰ và thông báo không thuộc phạm vi hỗ trợ. 
                        - TUYỆT ĐỐI KHÔNG lấy thông tin liên hệ của các chủ sân trong dữ liệu để cung cấp cho người dùng khi họ hỏi lạc đề hoặc cần hỗ trợ từ hệ thống.
                        - Nếu cần hướng dẫn khách liên hệ để hỗ trợ thêm về hệ thống LaceUP, hãy yêu cầu khách gửi email về địa chỉ: %s.
                        
                        - QUAN TRỌNG: Khi gợi ý một sân cụ thể, BẠN BẮT BUỘC PHẢI DÙNG CÚ PHÁP TAG SAU ĐỂ HỆ THỐNG VẼ UI (Viết liền trên 1 dòng):
                                                  [RENTAL|Tên sân|Địa chỉ cụ thể|Giá thuê|Điểm đánh giá|Đường dẫn chi tiết sân]
                        - LƯU Ý VỀ ĐƯỜNG DẪN (URL): Bạn phải kết hợp mã định danh (ID) hoặc đường dẫn tương đối của sân với tên miền Frontend chính thức được cấp ở đây: %s
                                                  (Ví dụ mẫu: [RENTAL|Sân Cầu Lông Pro|456 Lê Văn Việt|80,000 VNĐ/giờ|1 lượt đánh giá 5 sao|%s/rental-area/123])
                        - TUYỆT ĐỐI KHÔNG tự liệt kê lại Địa chỉ, Giá, Đánh giá, hay Link ra dạng gạch đầu dòng văn bản thường. Chỉ nói 1 câu dẫn dắt ngắn gọn rồi chèn ngay block [RENTAL|...] vào.
                        - KHÔNG tự ý cung cấp thêm thông tin dư thừa.
                        - Phân biệt rõ loại hình thể thao trong dữ liệu, không tự ý suy diễn.
                        - Nếu khách hàng hỏi sân gần nhất, hãy hỏi địa chỉ hiện tại của khách để tư vấn.
                        - Nếu khách tìm khung giờ không có sẵn, hãy gợi ý sân có thời gian hoạt động gần nhất.
                        - Nếu khách hàng hỏi về sân có đánh giá 5 sao (hoặc sân tốt), hãy dựa vào điểm đánh giá trung bình hoặc số lượt đánh giá 5 sao trong dữ liệu để liệt kê các sân phù hợp nhất. Nếu không có sân nào nhắc đến 5 sao, hãy thông báo rõ ràng.
                        
                        Khách hàng: %s""",
                context, SUPPORT_EMAIL, urlProperties.getFrontend(), urlProperties.getFrontend(), userMessage
        );
        try {
            String aiResponse = chatClient.prompt()
                    .user(finalPrompt)
                    .call()
                    .content();

            // 4. XỬ LÝ CHUỖI TRẢ VỀ TỪ AI Ở ĐÂY
            if (aiResponse != null) {
                aiResponse = aiResponse.replace("\\n", "\n");
                aiResponse = aiResponse.replace("**", "");
                aiResponse = aiResponse.replaceAll(" +", " ").trim();
            }

            return aiResponse;

        } catch (Exception e) {
            log.error("Error generating AI response: {}", e.getMessage());
            return "Xin lỗi, hiện tại tôi không thể xử lý yêu cầu này. Vui lòng liên hệ hotline để được hỗ trợ trực tiếp!";
        }
    }
}
