package org.sport.backend.ai.controller;

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
}