import 'court_copy.dart';
import 'court_image.dart';

enum CourtStatus { ACTIVE, INACTIVE }
enum CourtCopyStatus { ACTIVE, INACTIVE }

extension CourtStatusExt on CourtStatus {
  String get name => toString().split('.').last;
}

// 2. Booking Short
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

// 7. Court Response (Sân chính)
class CourtResponse {
  final String courtId;
  final String courtName;
  final String? courtCode;
  final String? categoryId;
  final String? categoryName;
  final double pricePerHour;
  final String rentalAreaId;
  final String? status;
  final String? description;
  final List<CourtImageResponse>? images;
  final List<CourtCopyResponse>? courtCopies;
  final String? createdAt;
  final String? updatedAt;

  CourtResponse({
    required this.courtId,
    required this.courtName,
    this.courtCode,
    this.categoryId,
    this.categoryName,
    required this.pricePerHour,
    required this.rentalAreaId,
    this.status,
    this.description,
    this.images,
    this.courtCopies,
    this.createdAt,
    this.updatedAt,
  });

  factory CourtResponse.fromJson(Map<String, dynamic> json) {
    return CourtResponse(
      courtId: json['courtId']?.toString() ?? '',
      courtName: json['courtName']?.toString() ?? '',
      courtCode: json['courtCode']?.toString(),
      categoryId: json['categoryId']?.toString(),
      categoryName: json['categoryName']?.toString(),
      pricePerHour: double.tryParse(json['pricePerHour']?.toString() ?? '0') ?? 0.0,
      rentalAreaId: json['rentalAreaId']?.toString() ?? '',
      status: json['status']?.toString(),
      description: json['description']?.toString(),
      images: json['images'] != null
          ? (json['images'] as List).map((i) => CourtImageResponse.fromJson(i)).toList()
          : null,
      courtCopies: json['courtCopies'] != null
          ? (json['courtCopies'] as List).map((i) => CourtCopyResponse.fromJson(i)).toList()
          : null,
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}