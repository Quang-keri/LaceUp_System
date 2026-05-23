import 'address.dart';

class RentalAreaResponse {
  final String rentalAreaId;
  final String rentalAreaName;
  final Address? address;
  final String contactName;
  final String contactPhone;
  final String status;
  final int cityId;
  final String cityName;
  final List<dynamic> courts;

  RentalAreaResponse({
    required this.rentalAreaId,
    required this.rentalAreaName,
    this.address,
    required this.contactName,
    required this.contactPhone,
    required this.status,
    required this.cityId,
    required this.cityName,
    required this.courts,
  });

  factory RentalAreaResponse.fromJson(Map<String, dynamic> json) {
    return RentalAreaResponse(
      rentalAreaId: json['rentalAreaId']?.toString() ?? '',
      rentalAreaName: json['rentalAreaName']?.toString() ?? '',
      address: json['address'] != null ? Address.fromJson(json['address']) : null,
      contactName: json['contactName']?.toString() ?? '',
      contactPhone: json['contactPhone']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
      cityId: json['city']?['cityId'] ?? 0,
      cityName: json['city']?['cityName'] ?? '',
      courts: json['courts'] != null ? List<dynamic>.from(json['courts']) : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'rentalAreaId': rentalAreaId,
      'rentalAreaName': rentalAreaName,
      'address': address,
      'contactName': contactName,
      'contactPhone': contactPhone,
      'status': status,
      'cityId': cityId,
      'cityName': cityName,
      'courts': courts,
    };
  }
}