package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "17. Report")
public class ReportController {

    private final ReportService reportService;

    private final UserRepository userRepository;

    @GetMapping("/dashboard/all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFullDashboard(
            @RequestParam(value = "range", defaultValue = "all") String range
    ) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        boolean isOwner = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_OWNER"));

        UUID ownerId = null;

        if (isOwner) {
            var user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            ownerId = user.getUserId();
        }

        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .code(200)
                        .result(reportService.getFullDashboardStats(range, ownerId))
                        .build()
        );
    }
}