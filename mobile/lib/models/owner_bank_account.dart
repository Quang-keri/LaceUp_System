class OwnerBankAccount {
  final String bankName;
  final String bankFullName;
  final String bankCode;
  final String bankBin;
  final String bankLogo;

  final String accountNumber;
  final String accountHolderName;
  final String branchName;
  final String qrCode;

  const OwnerBankAccount({
    required this.bankName,
    required this.bankFullName,
    required this.bankCode,
    required this.bankBin,
    required this.bankLogo,
    required this.accountNumber,
    required this.accountHolderName,
    required this.branchName,
    required this.qrCode,
  });

  factory OwnerBankAccount.fromJson(Map<String, dynamic> json) {
    return OwnerBankAccount(
      bankName: json['bankName']?.toString() ?? '',
      bankFullName: json['bankFullName']?.toString() ?? '',
      bankCode: json['bankCode']?.toString() ?? '',
      bankBin: json['bankBin']?.toString() ?? '',
      bankLogo: json['bankLogo']?.toString() ?? '',
      accountNumber: json['accountNumber']?.toString() ?? '',
      accountHolderName: json['accountHolderName']?.toString() ?? '',
      branchName: json['branchName']?.toString() ?? '',
      qrCode: json['qrCode']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toRequestJson() {
    return {
      'bankName': bankName,
      'bankFullName': bankFullName,
      'bankCode': bankCode,
      'bankBin': bankBin,
      'bankLogo': bankLogo,
      'accountNumber': accountNumber,
      'accountHolderName': accountHolderName,
      'branchName': branchName,
      'qrCode': qrCode,
    };
  }
}