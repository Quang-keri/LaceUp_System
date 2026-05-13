package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.bank.BankAccountRequest;

import org.sport.backend.dto.response.bank.BankAccountResponse;
import org.sport.backend.entity.User;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.service.BankAccountService;
import org.sport.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;
@RestController
@RequestMapping("/owner/bank-accounts")
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

    @PutMapping
    public ResponseEntity<?> createOrUpdateBankAccount(
            Principal principal,
            @RequestBody BankAccountRequest request
    ) {
        User user = userService.findByEmail(principal.getName());

        BankAccountResponse response =
                bankAccountService.createOrUpdateBankAccount(user.getUserId(), request);

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
    public ResponseEntity<?> deleteBankAccount(@PathVariable UUID bankAccountId) {
        bankAccountService.deleteBankAccount(bankAccountId);

        return ResponseEntity.ok(
                new ApiResponse<>(200, "Bank account deleted", null)
        );
    }
}