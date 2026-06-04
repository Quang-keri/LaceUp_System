class BankAccountResponse {
  final String bankAccountId;
  final String bankName;
  final String accountNumber;
  final String accountHolderName;
  final String branchName;
  final String? qrCode;
  final bool? isVerified;

  BankAccountResponse({
    required this.bankAccountId,
    required this.bankName,
    required this.accountNumber,
    required this.accountHolderName,
    required this.branchName,
    this.qrCode,
    this.isVerified,
  });

  factory BankAccountResponse.fromJson(Map<String, dynamic> json) {
    return BankAccountResponse(
      bankAccountId: json['bankAccountId']?.toString() ?? '',
      bankName: json['bankName']?.toString() ?? '',
      accountNumber: json['accountNumber']?.toString() ?? '',
      accountHolderName: json['accountHolderName']?.toString() ?? '',
      branchName: json['branchName']?.toString() ?? '',
      qrCode: json['qrCode']?.toString(),
      isVerified: json['isVerified'] as bool?,
    );
  }
}