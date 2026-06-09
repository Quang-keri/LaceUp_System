import 'court.dart';

class SlotResponse {
  final String? slotId;
  final String? courtCopyId;
  final String? courtCode;
  final String? startTime;
  final String? endTime;
  final double? price;
  final String? slotStatus;
  final String? bookingType;
  final String? bookingId;
  final BookingShortResponse? bookingShortResponse;

  SlotResponse({
    this.slotId,
    this.courtCopyId,
    this.courtCode,
    this.startTime,
    this.endTime,
    this.price,
    this.slotStatus,
    this.bookingType,
    this.bookingId,
    this.bookingShortResponse,
  });

  factory SlotResponse.fromJson(Map<String, dynamic> json) {
    return SlotResponse(
      slotId: json['slotId']?.toString(),
      courtCopyId: json['courtCopyId']?.toString(),
      courtCode: json['courtCode']?.toString(),
      startTime: json['startTime']?.toString(),
      endTime: json['endTime']?.toString(),
      price: double.tryParse(json['price']?.toString() ?? ''),
      slotStatus: json['slotStatus']?.toString(),
      bookingType: json['bookingType']?.toString(),
      bookingId: json['bookingId']?.toString(),
      bookingShortResponse: json['bookingShortResponse'] != null
          ? BookingShortResponse.fromJson(json['bookingShortResponse'])
          : null,
    );
  }
}