class VietQrBank {
  final int? id;
  final String name;
  final String code;
  final String bin;
  final String shortName;
  final String logo;
  final int transferSupported;
  final int lookupSupported;

  const VietQrBank({
    this.id,
    required this.name,
    required this.code,
    required this.bin,
    required this.shortName,
    required this.logo,
    this.transferSupported = 0,
    this.lookupSupported = 0,
  });

  factory VietQrBank.fromJson(Map<String, dynamic> json) {
    return VietQrBank(
      id: int.tryParse(json['id']?.toString() ?? ''),
      name: json['name']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      bin: json['bin']?.toString() ?? '',
      shortName: json['shortName']?.toString() ?? '',
      logo: json['logo']?.toString() ?? '',
      transferSupported:
      int.tryParse(json['transferSupported']?.toString() ?? '0') ?? 0,
      lookupSupported:
      int.tryParse(json['lookupSupported']?.toString() ?? '0') ?? 0,
    );
  }

  factory VietQrBank.fromBankAccount({
    required String name,
    required String shortName,
    required String code,
    required String bin,
    required String logo,
  }) {
    return VietQrBank(
      name: name,
      shortName: shortName,
      code: code,
      bin: bin,
      logo: logo,
    );
  }

  bool matches(String keyword) {
    final normalizedKeyword = keyword.trim().toLowerCase();

    if (normalizedKeyword.isEmpty) {
      return true;
    }

    return name.toLowerCase().contains(normalizedKeyword) ||
        shortName.toLowerCase().contains(normalizedKeyword) ||
        code.toLowerCase().contains(normalizedKeyword) ||
        bin.toLowerCase().contains(normalizedKeyword);
  }
}