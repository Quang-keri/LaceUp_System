package org.sport.backend.mapper;

import org.sport.backend.dto.response.bank.BankAccountResponse;
import org.sport.backend.entity.BankAccount;
import org.springframework.stereotype.Component;

@Component
public class BankAccountMapper {

    public BankAccountResponse toResponse(BankAccount bankAccount) {
        if (bankAccount == null) {
            return null;
        }

        return BankAccountResponse.builder()
                .bankAccountId(bankAccount.getBankAccountId())
                .bankName(bankAccount.getBankName())
                .accountNumber(bankAccount.getAccountNumber())
                .accountHolderName(bankAccount.getAccountHolderName())
                .branchName(bankAccount.getBranchName())
                .qrCode(bankAccount.getQrCode())
                .isVerified(bankAccount.getIsVerified())
                .createdAt(bankAccount.getCreatedAt())
                .updatedAt(bankAccount.getUpdatedAt())
                .build();
    }
}
