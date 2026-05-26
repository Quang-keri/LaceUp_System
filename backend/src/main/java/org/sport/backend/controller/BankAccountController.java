package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.bank.BankAccountRequest;

import org.sport.backend.dto.response.bank.BankAccountResponse;
import org.sport.backend.entity.User;
import org.sport.backend.service.BankAccountService;
import org.sport.backend.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getMyBankAccount(Principal principal) {
        User user = userService.findByEmail(principal.getName());
        var bankAccount = bankAccountService.getBankAccountByUserId(user.getUserId());

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Bank account retrieved",
                        bankAccount.orElse(null)
                )
        );
    }

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createOrUpdateBankAccount(
            @RequestPart("data") BankAccountRequest request,
            @RequestPart(value = "qrCodeFile", required = false) MultipartFile qrCodeFile
    ) {

        BankAccountResponse response =
                bankAccountService.createOrUpdateBankAccount(request, qrCodeFile);

        return ResponseEntity.ok(
                new ApiResponse<>(200, "Bank account updated successfully", response)
        );
    }

    @PutMapping("/{bankAccountId}/verify")
    public ResponseEntity<?> verifyBankAccount(
            @PathVariable UUID bankAccountId,
            @RequestParam String verificationCode
    ) {
        BankAccountResponse response =
                bankAccountService.verifyBankAccount(bankAccountId, verificationCode);

        return ResponseEntity.ok(
                new ApiResponse<>(200, "Bank account verified", response)
        );
    }

    @DeleteMapping("/{bankAccountId}")
    public ResponseEntity<?> deleteBankAccount(@PathVariable UUID bankAccountId
    ) {
        bankAccountService.deleteBankAccount(bankAccountId);

        return ResponseEntity.ok(
                new ApiResponse<>(200, "Bank account deleted", null)
        );
    }
}