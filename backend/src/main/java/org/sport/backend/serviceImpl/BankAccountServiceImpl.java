package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.request.bank.BankAccountRequest;
import org.sport.backend.dto.response.bank.BankAccountResponse;
import org.sport.backend.entity.BankAccount;
import org.sport.backend.entity.User;
import org.sport.backend.mapper.BankAccountMapper;
import org.sport.backend.repository.BankAccountRepository;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.service.BankAccountService;
import org.sport.backend.service.CloudinaryService;
import org.sport.backend.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final UserRepository userRepository;

    private final CloudinaryService cloudinaryService;
    private final UserService userService;

    private final BankAccountMapper bankAccountMapper;

    @Override
    @Transactional
    public BankAccountResponse createOrUpdateBankAccount(
            BankAccountRequest request,
            MultipartFile qrCodeFile
    ) {

        UUID userId = userService.getCurrentUserEntity().getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BankAccount bankAccount = bankAccountRepository.findByUser_UserId(userId)
                .orElse(BankAccount.builder().user(user).build());

        bankAccount.setBankName(request.getBankName());
        bankAccount.setAccountNumber(request.getAccountNumber());
        bankAccount.setAccountHolderName(request.getAccountHolderName());
        bankAccount.setBranchName(request.getBranchName());
        bankAccount.setIsVerified(false);
        bankAccount.setBankBin(request.getBankBin());
        if (qrCodeFile != null && !qrCodeFile.isEmpty()) {
            CloudinaryUploadResult uploadResult = cloudinaryService.uploadImage(qrCodeFile, "bank_qrcodes");
            bankAccount.setQrCode(uploadResult.getUrl());
        } else if (request.getQrCode() != null && !request.getQrCode().isBlank()) {
            bankAccount.setQrCode(request.getQrCode());
        }

        BankAccount saved = bankAccountRepository.save(bankAccount);

        return bankAccountMapper.toResponse(saved);
    }

    @Override
    public Optional<BankAccountResponse> getBankAccountByUserId(UUID userId) {
        return bankAccountRepository.findByUser_UserId(userId)
                .map(bankAccountMapper::toResponse); // Sử dụng mapper
    }

    @Override
    @Transactional
    public BankAccountResponse verifyBankAccount(UUID bankAccountId, String verificationCode) {
        BankAccount bankAccount = bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new RuntimeException("Bank account not found"));

        if (verificationCode.equals(bankAccount.getVerificationCode())) {
            bankAccount.setIsVerified(true);
            BankAccount saved = bankAccountRepository.save(bankAccount);
            return bankAccountMapper.toResponse(saved); // Sử dụng mapper
        }
        throw new RuntimeException("Invalid verification code");
    }

    @Override
    @Transactional
    public void deleteBankAccount(UUID bankAccountId) {
        bankAccountRepository.deleteById(bankAccountId);
    }
}
