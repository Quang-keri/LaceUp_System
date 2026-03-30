package org.sport.backend.ai.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.ai.dto.ChatbotRequest;
import org.sport.backend.ai.service.ChatbotService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/ask")
    public String ask(@RequestBody ChatbotRequest request) {
        return chatbotService.askAI(request.getMessage());
    }
}