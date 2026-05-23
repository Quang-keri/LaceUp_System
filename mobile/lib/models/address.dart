class Address {
  final String street;
  final String ward;
  final String cityName;

  Address({required this.street, required this.ward, required this.cityName});

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      street: json['street']?.toString() ?? '',
      ward: json['ward']?.toString() ?? '',
      cityName: json['city']?['cityName']?.toString() ?? '',
    );
  }

  String get fullAddress => [
    street,
    ward,
    cityName,
  ].where((e) => e.isNotEmpty).join(', ');
}