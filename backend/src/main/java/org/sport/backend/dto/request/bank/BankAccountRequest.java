package org.sport.backend.dto.request.bank;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountRequest {
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private String branchName;
    private String bankBin;
    private String qrCode;
}
