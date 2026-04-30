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
  // Tạm thời dùng List<dynamic> cho courts nếu bạn chưa tạo court_model.dart
  // Nếu tạo rồi, hãy đổi thành List<CourtResponse>
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
      cityId: int.tryParse(json['cityId']?.toString() ?? '0') ?? 0,
      cityName: json['cityName']?.toString() ?? '',
      courts: json['courts'] != null ? List<dynamic>.from(json['courts']) : [],
    );
  }
}