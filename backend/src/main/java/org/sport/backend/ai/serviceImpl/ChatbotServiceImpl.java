package org.sport.backend.ai.serviceImpl;

import lombok.extern.slf4j.Slf4j;
import org.sport.backend.ai.service.ChatbotService;
import org.sport.backend.properties.ChatBoxProperties;
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

    public ChatbotServiceImpl(ChatClient.Builder builder, VectorStore vectorStore, ChatBoxProperties chatBoxProperties) {
        this.chatClient = builder.build();
        this.vectorStore = vectorStore;
        this.chatBoxProperties = chatBoxProperties;
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
        String finalPrompt = String.format(
                """
                        Hệ thống: Bạn là trợ lý ảo của LaceUP. Bạn được cung cấp các dữ liệu sau từ hệ thống: [%s].
                        
                        Yêu cầu bắt buộc đối với bạn:
                        - CHỈ trả lời đúng trọng tâm câu hỏi của khách hàng.
                        - KHÔNG tự ý cung cấp thêm thông tin dư thừa (Ví dụ: khách hỏi tìm trận đấu/kèo thì CHỈ trả lời về trận đấu/kèo, tuyệt đối KHÔNG tự liệt kê thêm các sân cho thuê nếu khách không hỏi).
                        - Phân biệt rõ loại hình thể thao (bóng đá, cầu lông, v.v.) trong dữ liệu, không tự ý suy diễn.
                        - Nếu dữ liệu báo không có thông tin khớp với câu hỏi, hãy lịch sự báo không tìm thấy và hướng dẫn khách gọi hotline.
                        
                        Khách hàng: %s""",
                context, userMessage
        );

        try {
            String aiResponse = chatClient.prompt()
                    .user(finalPrompt)
                    .call()
                    .content();

            // 4. XỬ LÝ CHUỖI TRẢ VỀ TỪ AI Ở ĐÂY
            if (aiResponse != null) {
                // Biến chuỗi "\n" (nếu AI trả về dạng text thô) thành ký tự xuống dòng thực sự
                aiResponse = aiResponse.replace("\\n", "\n");

                // XÓA DÒNG NÀY: aiResponse = aiResponse.replace("\n", " ");
                // -> Không thay ký tự xuống dòng thành khoảng trắng nữa!

                // Xóa định dạng in đậm (Markdown **) để text hiển thị sạch sẽ hơn
                aiResponse = aiResponse.replace("**", "");

                // (Tùy chọn) Xóa bớt khoảng trắng thừa nhưng vẫn giữ lại \n
                aiResponse = aiResponse.replaceAll(" +", " ").trim();
            }

            return aiResponse;

        } catch (Exception e) {
            log.error("Error generating AI response: {}", e.getMessage());
            return "Xin lỗi, hiện tại tôi không thể xử lý yêu cầu này. Vui lòng liên hệ hotline để được hỗ trợ trực tiếp!";
        }
    }
}