package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.request.bank.BankAccountRequest;
import org.sport.backend.dto.response.bank.BankAccountResponse;
import org.sport.backend.entity.BankAccount;
import org.sport.backend.entity.User;
import org.sport.backend.repository.BankAccountRepository;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.service.BankAccountService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public BankAccountResponse createOrUpdateBankAccount(UUID userId, BankAccountRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        BankAccount bankAccount = bankAccountRepository.findByUser_UserId(userId)
            .orElse(BankAccount.builder().user(user).build());

        bankAccount.setBankName(request.getBankName());
        bankAccount.setAccountNumber(request.getAccountNumber());
        bankAccount.setAccountHolderName(request.getAccountHolderName());
        bankAccount.setBranchName(request.getBranchName());
        bankAccount.setIsVerified(false);

        BankAccount saved = bankAccountRepository.save(bankAccount);
        return mapToResponse(saved);
    }

    @Override
    public Optional<BankAccountResponse> getBankAccountByUserId(UUID userId) {
        return bankAccountRepository.findByUser_UserId(userId)
            .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public BankAccountResponse verifyBankAccount(UUID bankAccountId, String verificationCode) {
        BankAccount bankAccount = bankAccountRepository.findById(bankAccountId)
            .orElseThrow(() -> new RuntimeException("Bank account not found"));

        if (verificationCode.equals(bankAccount.getVerificationCode())) {
            bankAccount.setIsVerified(true);
            BankAccount saved = bankAccountRepository.save(bankAccount);
            return mapToResponse(saved);
        }
        throw new RuntimeException("Invalid verification code");
    }

    @Override
    @Transactional
    public void deleteBankAccount(UUID bankAccountId) {
        bankAccountRepository.deleteById(bankAccountId);
    }

    private BankAccountResponse mapToResponse(BankAccount bankAccount) {
        return BankAccountResponse.builder()
            .bankAccountId(bankAccount.getBankAccountId())
            .bankName(bankAccount.getBankName())
            .accountNumber(bankAccount.getAccountNumber())
            .accountHolderName(bankAccount.getAccountHolderName())
            .branchName(bankAccount.getBranchName())
            .isVerified(bankAccount.getIsVerified())
            .createdAt(bankAccount.getCreatedAt())
            .updatedAt(bankAccount.getUpdatedAt())
            .build();
    }
}
