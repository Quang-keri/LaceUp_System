package org.sport.backend.ai.serviceImpl;

import org.sport.backend.ai.service.ChatbotService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
// Bỏ @RequiredArgsConstructor để tự viết Constructor (vì ChatClient cần Builder)
public class ChatbotServiceImpl implements ChatbotService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    @Value("${app.ai.vector.top-k:5}")
    private int topK;

    @Value("${app.ai.vector.threshold:0.3}")
    private double threshold;

    // Sửa lỗi "No beans of ChatClient": Inject ChatClient.Builder thay vì ChatClient
    public ChatbotServiceImpl(ChatClient.Builder builder, VectorStore vectorStore) {
        this.chatClient = builder.build();
        this.vectorStore = vectorStore;
    }

    @Override
    public String askAI(String userMessage) {
        // 1. Retrieval
        List<Document> similarDocuments = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(userMessage)
                        .topK(topK)
                        .similarityThreshold(threshold)
                        .build()
        );

        // 2. Kiểm tra và gom ngữ cảnh
        String context;
        if (similarDocuments.isEmpty()) {
            // Nếu không tìm thấy gì trong DB, gán một thông báo để AI biết
            context = "Không có dữ liệu cụ thể về vấn đề này trong hệ thống LaceUP.";
        } else {
            context = similarDocuments.stream()
                    .map(Document::getText)
                    .collect(Collectors.joining(System.lineSeparator()));
        }

        // 3. Generation (Gộp Prompt để tránh lỗi System Instruction trên Gemma)
        String finalPrompt = String.format(
                "Hệ thống: Bạn là trợ lý ảo của LaceUP. Dựa vào dữ liệu: [%s]. " +
                        "Hãy trả lời khách hàng. Nếu dữ liệu báo không có thông tin, hãy lịch sự từ chối và hướng dẫn khách gọi hotline.\n\n" +
                        "Khách hàng: %s",
                context, userMessage
        );

        try {
            return chatClient.prompt()
                    .user(finalPrompt)
                    .call()
                    .content();
        } catch (Exception e) {
            e.printStackTrace();
            return "Xin lỗi, hiện tại tôi không thể xử lý yêu cầu này. Vui lòng liên hệ hotline để được hỗ trợ trực tiếp!";
        }
    }
}