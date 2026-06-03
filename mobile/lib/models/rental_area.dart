import 'address.dart';
import 'court.dart';

class RentalAreaResponse {
  final String rentalAreaId;
  final String rentalAreaName;
  final Address? address;
  final String contactName;
  final String contactPhone;
  final String status;
  final int cityId;
  final String cityName;
  final List<CourtResponse>? courts;

  final String? createdAt;
  final String? updatedAt;
  final String? deletedAt;
  final String? openTime;
  final String? closeTime;
  final bool? isActive;
  final double? latitude;
  final double? longitude;

  RentalAreaResponse({
    required this.rentalAreaId,
    required this.rentalAreaName,
    this.address,
    required this.contactName,
    required this.contactPhone,
    required this.status,
    required this.cityId,
    required this.cityName,
    this.courts,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
    this.openTime,
    this.closeTime,
    this.isActive,
    this.latitude,
    this.longitude,
  });

  factory RentalAreaResponse.fromJson(Map<String, dynamic> json) {
    final courtsData = json['courtResponses'] ?? json['courts'];

    return RentalAreaResponse(
      rentalAreaId: json['rentalAreaId']?.toString() ?? '',
      rentalAreaName: json['rentalAreaName']?.toString() ?? '',
      address: json['address'] != null
          ? Address.fromJson(json['address'])
          : null,
      contactName: json['contactName']?.toString() ?? '',
      contactPhone: json['contactPhone']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
      cityId: json['cityId'] ?? json['city']?['cityId'] ?? 0,
      cityName: json['cityName'] ?? json['city']?['cityName'] ?? '',

      courts: courtsData != null
          ? (courtsData as List).map((i) => CourtResponse.fromJson(i)).toList()
          : [],

      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
      deletedAt: json['deletedAt']?.toString(),
      openTime: json['openTime']?.toString(),
      closeTime: json['closeTime']?.toString(),
      isActive: json['isActive'] as bool?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'rentalAreaId': rentalAreaId,
      'rentalAreaName': rentalAreaName,
      'address': address?.toJson(),
      'contactName': contactName,
      'contactPhone': contactPhone,
      'status': status,
      'cityId': cityId,
      'cityName': cityName,
      'city': {'cityId': cityId, 'cityName': cityName},
      'courtResponses': courts,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'deletedAt': deletedAt,
      'openTime': openTime,
      'closeTime': closeTime,
      'isActive': isActive,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  RentalAreaResponse copyWith({
    List<CourtResponse>? courts,
  }) {
    return RentalAreaResponse(
      rentalAreaId: rentalAreaId,
      rentalAreaName: rentalAreaName,
      address: address,
      contactName: contactName,
      contactPhone: contactPhone,
      status: status,
      cityId: cityId,
      cityName: cityName,
      courts: courts ?? this.courts,
      createdAt: createdAt,
      updatedAt: updatedAt,
      deletedAt: deletedAt,
      openTime: openTime,
      closeTime: closeTime,
      isActive: isActive,
      latitude: latitude,
      longitude: longitude,
    );
  }
}
