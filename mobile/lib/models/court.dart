import 'court_copy.dart';
import 'court_image.dart';

enum CourtStatus { ACTIVE, INACTIVE }
enum CourtCopyStatus { ACTIVE, INACTIVE }

extension CourtStatusExt on CourtStatus {
  String get name => toString().split('.').last;
}

class BookingShortResponse {
  final String bookingId;
  final String? note;
  final String userName;
  final String userPhone;

  BookingShortResponse({
    required this.bookingId,
    this.note,
    required this.userName,
    required this.userPhone,
  });

  factory BookingShortResponse.fromJson(Map<String, dynamic> json) {
    return BookingShortResponse(
      bookingId: json['bookingId']?.toString() ?? '',
      note: json['note']?.toString(),
      userName: json['userName']?.toString() ?? '',
      userPhone: json['userPhone']?.toString() ?? '',
    );
  }
}

class CourtAmenityResponse {
  final String amenityId;
  final String amenityName;
  final String? icon;
  final String? description;

  CourtAmenityResponse({
    required this.amenityId,
    required this.amenityName,
    this.icon,
    this.description,
  });

  factory CourtAmenityResponse.fromJson(Map<String, dynamic> json) {
    return CourtAmenityResponse(
      amenityId: json['amenityId']?.toString() ?? '',
      amenityName: json['amenityName']?.toString() ?? '',
      icon: json['icon']?.toString(),
      description: json['description']?.toString(),
    );
  }
}

class CourtPriceRuleResponse {
  final String courtPriceId;
  final String courtId;
  final String? startTime;
  final String? endTime;
  final String? startDate;
  final String? endDate;
  final String? specificDate;
  final String? priceType;
  final String? dayType;
  final double pricePerHour;
  final int priority;

  CourtPriceRuleResponse({
    required this.courtPriceId,
    required this.courtId,
    this.startTime,
    this.endTime,
    this.startDate,
    this.endDate,
    this.specificDate,
    this.priceType,
    this.dayType,
    required this.pricePerHour,
    required this.priority,
  });

  factory CourtPriceRuleResponse.fromJson(Map<String, dynamic> json) {
    return CourtPriceRuleResponse(
      courtPriceId: json['courtPriceId']?.toString() ?? '',
      courtId: json['courtId']?.toString() ?? '',
      startTime: json['startTime']?.toString(),
      endTime: json['endTime']?.toString(),
      startDate: json['startDate']?.toString(),
      endDate: json['endDate']?.toString(),
      specificDate: json['specificDate']?.toString(),
      priceType: json['priceType']?.toString(),
      dayType: json['dayType']?.toString(),
      pricePerHour:
      double.tryParse(json['pricePerHour']?.toString() ?? '0') ?? 0.0,
      priority: int.tryParse(json['priority']?.toString() ?? '0') ?? 0,
    );
  }
}

class CourtResponse {
  final String courtId;
  final String courtName;
  final String? courtCode;
  final String? categoryId;
  final String? categoryName;
  final double pricePerHour;
  final double minPrice;
  final double maxPrice;
  final String rentalAreaId;
  final String? status;
  final String? description;

  final List<CourtImageResponse> images;
  final List<CourtCopyResponse> courtCopies;
  final List<CourtAmenityResponse> amenities;
  final List<CourtPriceRuleResponse> priceRules;

  final String? createdAt;
  final String? updatedAt;

  CourtResponse({
    required this.courtId,
    required this.courtName,
    this.courtCode,
    this.categoryId,
    this.categoryName,
    required this.pricePerHour,
    required this.minPrice,
    required this.maxPrice,
    required this.rentalAreaId,
    this.status,
    this.description,
    this.images = const [],
    this.courtCopies = const [],
    this.amenities = const [],
    this.priceRules = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory CourtResponse.fromJson(Map<String, dynamic> json) {
    final category = json['category'];

    return CourtResponse(
      courtId: json['courtId']?.toString() ?? '',
      courtName: json['courtName']?.toString() ?? '',
      courtCode: json['courtCode']?.toString(),

      categoryId: json['categoryId']?.toString() ??
          (category is Map ? category['categoryId']?.toString() : null),

      categoryName: json['categoryName']?.toString() ??
          (category is Map ? category['categoryName']?.toString() : null),

      pricePerHour:
      double.tryParse(json['pricePerHour']?.toString() ?? '0') ?? 0.0,

      minPrice: double.tryParse(json['minPrice']?.toString() ?? '0') ?? 0.0,
      maxPrice: double.tryParse(json['maxPrice']?.toString() ?? '0') ?? 0.0,

      rentalAreaId: json['rentalAreaId']?.toString() ?? '',
      status: json['status']?.toString(),
      description: json['description']?.toString(),

      images: json['images'] is List
          ? (json['images'] as List)
          .map((i) => CourtImageResponse.fromJson(i))
          .toList()
          : [],

      courtCopies: json['courtCopies'] is List
          ? (json['courtCopies'] as List)
          .map((i) => CourtCopyResponse.fromJson(i))
          .toList()
          : [],

      amenities: json['amenities'] is List
          ? (json['amenities'] as List)
          .map((i) => CourtAmenityResponse.fromJson(i))
          .toList()
          : [],

      priceRules: json['priceRules'] is List
          ? (json['priceRules'] as List)
          .map((i) => CourtPriceRuleResponse.fromJson(i))
          .toList()
          : [],

      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }

  CourtResponse copyWith({
    List<CourtCopyResponse>? courtCopies,
  }) {
    return CourtResponse(
      courtId: courtId,
      courtName: courtName,
      courtCode: courtCode,
      categoryId: categoryId,
      categoryName: categoryName,
      pricePerHour: pricePerHour,
      minPrice: minPrice,
      maxPrice: maxPrice,
      rentalAreaId: rentalAreaId,
      status: status,
      description: description,
      images: images,
      courtCopies: courtCopies ?? this.courtCopies,
      amenities: amenities,
      priceRules: priceRules,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}