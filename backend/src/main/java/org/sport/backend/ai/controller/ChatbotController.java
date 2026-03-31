package org.sport.backend.ai.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.ai.dto.ChatbotRequest;
import org.sport.backend.ai.service.ChatbotService;
import org.sport.backend.dto.base.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<String>> ask(
            @RequestBody @Valid ChatbotRequest request) {
        return ResponseEntity.ok(
                ApiResponse.<String>builder()
                        .code(200)
                        .message("Get answer from AI successfully")
                        .result(chatbotService.askAI(request.getMessage()))
                        .build()
        );
    }

}