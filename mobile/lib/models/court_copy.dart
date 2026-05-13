import 'package:mobile/models/slot.dart';

class CourtCopyResponse {
  final String courtCopyId;
  final String courtCode;
  final String status;
  final List<SlotResponse>? slots;

  CourtCopyResponse({
    required this.courtCopyId,
    required this.courtCode,
    required this.status,
    this.slots,
  });

  factory CourtCopyResponse.fromJson(Map<String, dynamic> json) {
    return CourtCopyResponse(
      courtCopyId: json['courtCopyId']?.toString() ?? '',
      courtCode: json['courtCode']?.toString() ?? '',
      status: json['status']?.toString() ?? 'ACTIVE',
      slots: json['slots'] != null
          ? (json['slots'] as List).map((i) => SlotResponse.fromJson(i)).toList()
          : null,
    );
  }
}