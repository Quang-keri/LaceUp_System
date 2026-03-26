package org.sport.backend.ai.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.sport.backend.ai.service.KnowledgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    @PostMapping("/import")
    public ResponseEntity<String> importData(@RequestBody String text) {
        knowledgeService.importTextData(text);
        return ResponseEntity.ok("Đã nạp thành công dữ liệu vào Vector Database!");
    }

    @PostMapping("/train-all-areas")
    @Operation(summary = "Quét toàn bộ database sân và nạp vào AI")
    public ResponseEntity<String> trainAll() {
        knowledgeService.trainAiWithRentalAreas();
        return ResponseEntity.ok("AI đã học xong danh sách sân hiện tại!");
    }
}