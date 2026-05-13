class Address {
  final String street;
  final String ward;
  final String district;

  Address({required this.street, required this.ward, required this.district});

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      street: json['street']?.toString() ?? '',
      ward: json['ward']?.toString() ?? '',
      district: json['district']?.toString() ?? '',
    );
  }

  // Tiện ích để in ra địa chỉ đầy đủ dễ dàng
  String get fullAddress => [street, ward, district]
      .where((e) => e.isNotEmpty)
      .join(', ');
}