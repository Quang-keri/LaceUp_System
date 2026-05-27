package org.sport.backend.service;

import org.sport.backend.dto.request.bank.BankAccountRequest;
import org.sport.backend.dto.response.bank.BankAccountResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

public interface BankAccountService {

    BankAccountResponse createOrUpdateBankAccount(BankAccountRequest request, MultipartFile qrCodeFile);

    Optional<BankAccountResponse> getBankAccountByUserId(UUID userId);

    BankAccountResponse verifyBankAccount(UUID bankAccountId, String verificationCode);

    void deleteBankAccount(UUID bankAccountId);
}
