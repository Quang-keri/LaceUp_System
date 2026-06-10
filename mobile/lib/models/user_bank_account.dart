class UserBankAccount {
  final String bankName;
  final String accountNumber;
  final String accountHolderName;
  final String branchName;
  final String bankBin;
  final String qrCode;

  const UserBankAccount({
    required this.bankName,
    required this.accountNumber,
    required this.accountHolderName,
    required this.branchName,
    required this.bankBin,
    required this.qrCode,
  });

  factory UserBankAccount.fromJson(
      Map<String, dynamic> json,
      ) {
    return UserBankAccount(
      bankName: json['bankName']?.toString() ?? '',
      accountNumber:
      json['accountNumber']?.toString() ?? '',
      accountHolderName:
      json['accountHolderName']?.toString() ?? '',
      branchName:
      json['branchName']?.toString() ?? '',
      bankBin: json['bankBin']?.toString() ?? '',
      qrCode: json['qrCode']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bankName': bankName,
      'accountNumber': accountNumber,
      'accountHolderName': accountHolderName,
      'branchName': branchName,
      'bankBin': bankBin,
      'qrCode': qrCode,
    };
  }

  UserBankAccount copyWith({
    String? bankName,
    String? accountNumber,
    String? accountHolderName,
    String? branchName,
    String? bankBin,
    String? qrCode,
  }) {
    return UserBankAccount(
      bankName: bankName ?? this.bankName,
      accountNumber:
      accountNumber ?? this.accountNumber,
      accountHolderName:
      accountHolderName ?? this.accountHolderName,
      branchName: branchName ?? this.branchName,
      bankBin: bankBin ?? this.bankBin,
      qrCode: qrCode ?? this.qrCode,
    );
  }
}