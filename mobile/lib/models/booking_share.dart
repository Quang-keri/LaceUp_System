class SharedBookingPublicResponse {
  final String bookingId;
  final String bookingType;
  final String bookingStatus;

  final String rentalAreaId;
  final String rentalAreaName;

  final String? courtId;
  final String? courtName;
  final String? courtCode;

  final String? categoryName;

  final double pricePerTicket;

  final int currentParticipants;
  final int reservedParticipants;
  final int remainingSlots;

  final int maxParticipants;
  final int minParticipants;

  final String startTime;
  final String endTime;

  final String? note;
  final String? currentUserPaymentStatus;

  const SharedBookingPublicResponse({
    required this.bookingId,
    required this.bookingType,
    required this.bookingStatus,
    required this.rentalAreaId,
    required this.rentalAreaName,
    this.courtId,
    this.courtName,
    this.courtCode,
    this.categoryName,
    required this.pricePerTicket,
    required this.currentParticipants,
    required this.reservedParticipants,
    required this.remainingSlots,
    required this.maxParticipants,
    required this.minParticipants,
    required this.startTime,
    required this.endTime,
    this.note,
    this.currentUserPaymentStatus,
  });

  factory SharedBookingPublicResponse.fromJson(Map<String, dynamic> json) {
    return SharedBookingPublicResponse(
      bookingId: _stringValue(json['bookingId']),
      bookingType: _stringValue(json['bookingType'], fallback: 'SHARED'),
      bookingStatus: _stringValue(json['bookingStatus'], fallback: 'BOOKED'),
      rentalAreaId: _stringValue(json['rentalAreaId']),
      rentalAreaName: _stringValue(
        json['rentalAreaName'],
        fallback: 'Khu vực khác',
      ),
      courtId: _nullableString(json['courtId']),
      courtName: _nullableString(json['courtName']),
      courtCode: _nullableString(json['courtCode']),
      categoryName: _nullableString(json['categoryName']),
      pricePerTicket: _doubleValue(json['pricePerTicket']),
      currentParticipants: _intValue(json['currentParticipants']),
      reservedParticipants: _intValue(
        json['reservedParticipants'],
        fallback: _intValue(json['currentParticipants']),
      ),
      remainingSlots: _intValue(json['remainingSlots']),
      maxParticipants: _intValue(json['maxParticipants']),
      minParticipants: _intValue(json['minParticipants']),
      startTime: _stringValue(json['startTime']),
      endTime: _stringValue(json['endTime']),
      note: _nullableString(json['note']),
      currentUserPaymentStatus: _nullableString(json['currentUserPaymentStatus']),
    );
  }

  static String _stringValue(dynamic value, {String fallback = ''}) {
    final result = value?.toString().trim() ?? '';
    return result.isEmpty ? fallback : result;
  }

  static String? _nullableString(dynamic value) {
    final result = value?.toString().trim() ?? '';
    return result.isEmpty ? null : result;
  }

  static int _intValue(dynamic value, {int fallback = 0}) {
    if (value is int) {
      return value;
    }

    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? fallback;
  }

  static double _doubleValue(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value?.toString() ?? '') ?? 0;
  }
}
