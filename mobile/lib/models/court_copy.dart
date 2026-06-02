import 'slot.dart';

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
          ? (json['slots'] as List)
          .map((i) => SlotResponse.fromJson(i))
          .toList()
          : [],
    );
  }

  CourtCopyResponse copyWith({
    String? courtCopyId,
    String? courtCode,
    String? status,
    List<SlotResponse>? slots,
  }) {
    return CourtCopyResponse(
      courtCopyId: courtCopyId ?? this.courtCopyId,
      courtCode: courtCode ?? this.courtCode,
      status: status ?? this.status,
      slots: slots ?? this.slots,
    );
  }

  CourtCopyResponse copyWithFromSchedule(Map<String, dynamic> json) {
    return copyWith(
      status: json['status']?.toString() ?? status,
      slots: json['slots'] != null
          ? (json['slots'] as List)
          .map((i) => SlotResponse.fromJson(i))
          .toList()
          : slots,
    );
  }
}