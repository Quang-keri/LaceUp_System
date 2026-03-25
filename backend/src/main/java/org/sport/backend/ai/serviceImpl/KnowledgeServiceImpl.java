package org.sport.backend.ai.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.ai.service.KnowledgeService;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KnowledgeServiceImpl implements KnowledgeService {

    private final VectorStore vectorStore;

    @Override
    public void importTextData(String text) {
        // 1. Tạo document từ text
        Document document = new Document(text);

        // 2. Chia nhỏ văn bản dài thành các đoạn ngắn (chunks) để AI dễ tìm kiếm chính xác
        TokenTextSplitter splitter = new TokenTextSplitter();
        List<Document> chunks = splitter.apply(List.of(document));

        // 3. Lưu vào database.
        // Lệnh này tự động gọi model ONNX để mã hóa text thành dãy số (vector) và lưu vào PostgreSQL.
        vectorStore.add(chunks);
    }
}
