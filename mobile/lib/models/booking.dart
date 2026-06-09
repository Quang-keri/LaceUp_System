enum BookingStatus {
  booked,
  using,
  cancelled,
  completed;

  String toJson() => name.toUpperCase();

  static BookingStatus fromJson(String? value) {
    return BookingStatus.values.firstWhere(
          (status) => status.name.toUpperCase() == value?.toUpperCase(),
      orElse: () => BookingStatus.booked,
    );
  }
}

enum BookingType {
  private,
  shared,
  match;

  String toJson() => name.toUpperCase();

  static BookingType fromJson(String? value) {
    return BookingType.values.firstWhere(
          (type) => type.name.toUpperCase() == value?.toUpperCase(),
      orElse: () => BookingType.private,
    );
  }
}

enum TicketPaymentStatus {
  pending,
  success,
  failed,
  cancelled,
  refunded;

  String toJson() => name.toUpperCase();

  static TicketPaymentStatus fromJson(String? value) {
    return TicketPaymentStatus.values.firstWhere(
          (status) => status.name.toUpperCase() == value?.toUpperCase(),
      orElse: () => TicketPaymentStatus.pending,
    );
  }
}

class CreateBookingIntentPayload {
  final String? userId;
  final String userName;
  final String userPhone;
  final String? note;
  final List<CreateBookingSlotRequest> slotRequests;

  const CreateBookingIntentPayload({
    this.userId,
    required this.userName,
    required this.userPhone,
    this.note,
    required this.slotRequests,
  });

  factory CreateBookingIntentPayload.fromJson(Map<String, dynamic> json) {
    return CreateBookingIntentPayload(
      userId: json['userId']?.toString(),
      userName: json['userName']?.toString() ?? '',
      userPhone: json['userPhone']?.toString() ?? '',
      note: json['note']?.toString(),
      slotRequests: _asList(json['slotRequests'])
          .map(CreateBookingSlotRequest.fromJson)
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (userId != null) 'userId': userId,
      'userName': userName,
      'userPhone': userPhone,
      if (note != null) 'note': note,
      'slotRequests': slotRequests.map((slot) => slot.toJson()).toList(),
    };
  }
}

class CreateBookingSlotRequest {
  final String courtCopyId;
  final String startTime;
  final String endTime;

  const CreateBookingSlotRequest({
    required this.courtCopyId,
    required this.startTime,
    required this.endTime,
  });

  factory CreateBookingSlotRequest.fromJson(Map<String, dynamic> json) {
    return CreateBookingSlotRequest(
      courtCopyId: json['courtCopyId']?.toString() ?? '',
      startTime: json['startTime']?.toString() ?? '',
      endTime: json['endTime']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'courtCopyId': courtCopyId,
      'startTime': startTime,
      'endTime': endTime,
    };
  }
}

class RentalAreaSummary {
  final String rentalAreaId;
  final String rentalAreaName;

  const RentalAreaSummary({
    required this.rentalAreaId,
    required this.rentalAreaName,
  });

  factory RentalAreaSummary.fromJson(Map<String, dynamic> json) {
    return RentalAreaSummary(
      rentalAreaId: json['rentalAreaId']?.toString() ?? '',
      rentalAreaName: json['rentalAreaName']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'rentalAreaId': rentalAreaId,
      'rentalAreaName': rentalAreaName,
    };
  }
}

class BookingSlotResponse {
  final dynamic slotId;
  final String? courtCopyId;
  final String courtCode;
  final String? courtName;
  final String startTime;
  final String endTime;
  final double price;
  final String? slotStatus;

  const BookingSlotResponse({
    required this.slotId,
    this.courtCopyId,
    required this.courtCode,
    this.courtName,
    required this.startTime,
    required this.endTime,
    required this.price,
    this.slotStatus,
  });

  factory BookingSlotResponse.fromJson(Map<String, dynamic> json) {
    return BookingSlotResponse(
      slotId: json['slotId'],
      courtCopyId: json['courtCopyId']?.toString(),
      courtCode: json['courtCode']?.toString() ?? '',
      courtName: json['courtName']?.toString(),
      startTime: json['startTime']?.toString() ?? '',
      endTime: json['endTime']?.toString() ?? '',
      price: _asDouble(json['price']),
      slotStatus: json['slotStatus']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'slotId': slotId,
      if (courtCopyId != null) 'courtCopyId': courtCopyId,
      'courtCode': courtCode,
      if (courtName != null) 'courtName': courtName,
      'startTime': startTime,
      'endTime': endTime,
      'price': price,
      if (slotStatus != null) 'slotStatus': slotStatus,
    };
  }
}

class BookingResponse {
  final String userName;
  final String phoneNumber;
  final RentalAreaSummary rentalArea;
  final List<BookingSlotResponse> slots;
  final String bookingId;
  final String rentalAreaId;
  final String rentalAreaName;
  final String courtId;
  final String courtName;
  final String? customerEmail;
  final String bookingDate;
  final String startTime;
  final String endTime;
  final double totalPrice;
  final BookingStatus bookingStatus;
  final BookingType bookingType;
  final String? notes;
  final String? note;
  final String? createdAt;
  final String? updatedAt;
  final String? invoicePdfUrl;
  final double? depositAmount;
  final double? remainingAmount;
  final bool? isFullyPaid;
  final List<BookingServiceResponse> extraServiceResponses;
  final String? paymentMethod;
  final int? maxParticipants;
  final int? currentParticipants;
  final double? pricePerTicket;
  final String? participantId;
  final int? ticketQuantity;
  final double? ticketAmount;
  final TicketPaymentStatus? ticketPaymentStatus;

  const BookingResponse({
    required this.userName,
    required this.phoneNumber,
    required this.rentalArea,
    required this.slots,
    required this.bookingId,
    required this.rentalAreaId,
    required this.rentalAreaName,
    required this.courtId,
    required this.courtName,
    this.customerEmail,
    required this.bookingDate,
    required this.startTime,
    required this.endTime,
    required this.totalPrice,
    required this.bookingStatus,
    required this.bookingType,
    this.notes,
    this.note,
    this.createdAt,
    this.updatedAt,
    this.invoicePdfUrl,
    this.depositAmount,
    this.remainingAmount,
    this.isFullyPaid,
    this.extraServiceResponses = const [],
    this.paymentMethod,
    this.maxParticipants,
    this.currentParticipants,
    this.pricePerTicket,
    this.participantId,
    this.ticketQuantity,
    this.ticketAmount,
    this.ticketPaymentStatus,
  });

  factory BookingResponse.fromJson(Map<String, dynamic> json) {
    return BookingResponse(
      userName: json['userName']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString() ?? '',
      rentalArea: RentalAreaSummary.fromJson(_asMap(json['rentalArea'])),
      slots: _asList(json['slots']).map(BookingSlotResponse.fromJson).toList(),
      bookingId: json['bookingId']?.toString() ?? '',
      rentalAreaId: json['rentalAreaId']?.toString() ?? '',
      rentalAreaName: json['rentalAreaName']?.toString() ?? '',
      courtId: json['courtId']?.toString() ?? '',
      courtName: json['courtName']?.toString() ?? '',
      customerEmail: json['customerEmail']?.toString(),
      bookingDate: json['bookingDate']?.toString() ?? '',
      startTime: json['startTime']?.toString() ?? '',
      endTime: json['endTime']?.toString() ?? '',
      totalPrice: _asDouble(json['totalPrice']),
      bookingStatus: BookingStatus.fromJson(json['bookingStatus']?.toString()),
      bookingType: BookingType.fromJson(json['bookingType']?.toString()),
      notes: json['notes']?.toString(),
      note: json['note']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
      invoicePdfUrl: json['invoicePdfUrl']?.toString(),
      depositAmount: _asNullableDouble(json['depositAmount']),
      remainingAmount: _asNullableDouble(json['remainingAmount']),
      isFullyPaid: json['isFullyPaid'] as bool?,
      extraServiceResponses: _asList(json['extraServiceResponses'])
          .map(BookingServiceResponse.fromJson)
          .toList(),
      paymentMethod: json['paymentMethod']?.toString(),
      maxParticipants: _asNullableInt(json['maxParticipants']),
      currentParticipants: _asNullableInt(json['currentParticipants']),
      pricePerTicket: _asNullableDouble(json['pricePerTicket']),
      participantId: json['participantId']?.toString(),
      ticketQuantity: _asNullableInt(json['ticketQuantity']),
      ticketAmount: _asNullableDouble(json['ticketAmount']),
      ticketPaymentStatus: json['ticketPaymentStatus'] == null
          ? null
          : TicketPaymentStatus.fromJson(
        json['ticketPaymentStatus']?.toString(),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userName': userName,
      'phoneNumber': phoneNumber,
      'rentalArea': rentalArea.toJson(),
      'slots': slots.map((slot) => slot.toJson()).toList(),
      'bookingId': bookingId,
      'rentalAreaId': rentalAreaId,
      'rentalAreaName': rentalAreaName,
      'courtId': courtId,
      'courtName': courtName,
      if (customerEmail != null) 'customerEmail': customerEmail,
      'bookingDate': bookingDate,
      'startTime': startTime,
      'endTime': endTime,
      'totalPrice': totalPrice,
      'bookingStatus': bookingStatus.toJson(),
      'bookingType': bookingType.toJson(),
      if (notes != null) 'notes': notes,
      if (note != null) 'note': note,
      if (createdAt != null) 'createdAt': createdAt,
      if (updatedAt != null) 'updatedAt': updatedAt,
      if (invoicePdfUrl != null) 'invoicePdfUrl': invoicePdfUrl,
      if (depositAmount != null) 'depositAmount': depositAmount,
      if (remainingAmount != null) 'remainingAmount': remainingAmount,
      if (isFullyPaid != null) 'isFullyPaid': isFullyPaid,
      'extraServiceResponses':
      extraServiceResponses.map((service) => service.toJson()).toList(),
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
      if (maxParticipants != null) 'maxParticipants': maxParticipants,
      if (currentParticipants != null)
        'currentParticipants': currentParticipants,
      if (pricePerTicket != null) 'pricePerTicket': pricePerTicket,
      if (participantId != null) 'participantId': participantId,
      if (ticketQuantity != null) 'ticketQuantity': ticketQuantity,
      if (ticketAmount != null) 'ticketAmount': ticketAmount,
      if (ticketPaymentStatus != null)
        'ticketPaymentStatus': ticketPaymentStatus!.toJson(),
    };
  }
}

class BookingListResponse {
  final List<BookingResponse> data;
  final int page;
  final int size;
  final int totalElements;
  final int totalPages;

  const BookingListResponse({
    required this.data,
    required this.page,
    required this.size,
    required this.totalElements,
    required this.totalPages,
  });

  factory BookingListResponse.fromJson(Map<String, dynamic> json) {
    return BookingListResponse(
      data: _asList(json['data']).map(BookingResponse.fromJson).toList(),
      page: _asInt(json['page']),
      size: _asInt(json['size']),
      totalElements: _asInt(json['totalElements']),
      totalPages: _asInt(json['totalPages']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'data': data.map((booking) => booking.toJson()).toList(),
      'page': page,
      'size': size,
      'totalElements': totalElements,
      'totalPages': totalPages,
    };
  }
}

class CreateBookingRequest {
  final String rentalAreaId;
  final String courtId;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final String bookingDate;
  final String startTime;
  final String endTime;
  final String? notes;

  const CreateBookingRequest({
    required this.rentalAreaId,
    required this.courtId,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    required this.bookingDate,
    required this.startTime,
    required this.endTime,
    this.notes,
  });

  factory CreateBookingRequest.fromJson(Map<String, dynamic> json) {
    return CreateBookingRequest(
      rentalAreaId: json['rentalAreaId']?.toString() ?? '',
      courtId: json['courtId']?.toString() ?? '',
      customerName: json['customerName']?.toString() ?? '',
      customerPhone: json['customerPhone']?.toString() ?? '',
      customerEmail: json['customerEmail']?.toString(),
      bookingDate: json['bookingDate']?.toString() ?? '',
      startTime: json['startTime']?.toString() ?? '',
      endTime: json['endTime']?.toString() ?? '',
      notes: json['notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'rentalAreaId': rentalAreaId,
      'courtId': courtId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      if (customerEmail != null) 'customerEmail': customerEmail,
      'bookingDate': bookingDate,
      'startTime': startTime,
      'endTime': endTime,
      if (notes != null) 'notes': notes,
    };
  }
}

class UpdateBookingRequest {
  final BookingStatus? status;
  final String? notes;

  const UpdateBookingRequest({
    this.status,
    this.notes,
  });

  factory UpdateBookingRequest.fromJson(Map<String, dynamic> json) {
    return UpdateBookingRequest(
      status: json['status'] == null
          ? null
          : BookingStatus.fromJson(json['status']?.toString()),
      notes: json['notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (status != null) 'status': status!.toJson(),
      if (notes != null) 'notes': notes,
    };
  }
}

class BookingServiceResponse {
  final String serviceId;
  final String serviceName;
  final int quantity;
  final double price;

  const BookingServiceResponse({
    required this.serviceId,
    required this.serviceName,
    required this.quantity,
    required this.price,
  });

  factory BookingServiceResponse.fromJson(Map<String, dynamic> json) {
    return BookingServiceResponse(
      serviceId: json['serviceId']?.toString() ?? '',
      serviceName: json['serviceName']?.toString() ?? '',
      quantity: _asInt(json['quantity']),
      price: _asDouble(json['price']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'serviceId': serviceId,
      'serviceName': serviceName,
      'quantity': quantity,
      'price': price,
    };
  }
}

class BookingParticipantResponse {
  final String participantId;
  final String bookingId;
  final String userId;
  final String userName;
  final String? userPhone;
  final double amountPaid;
  final TicketPaymentStatus paymentStatus;
  final bool isHost;
  final String? paymentProofUrl;
  final String? paymentProofUploadedAt;

  const BookingParticipantResponse({
    required this.participantId,
    required this.bookingId,
    required this.userId,
    required this.userName,
    this.userPhone,
    required this.amountPaid,
    required this.paymentStatus,
    required this.isHost,
    this.paymentProofUrl,
    this.paymentProofUploadedAt,
  });

  factory BookingParticipantResponse.fromJson(Map<String, dynamic> json) {
    return BookingParticipantResponse(
      participantId: json['participantId']?.toString() ?? '',
      bookingId: json['bookingId']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      userName: json['userName']?.toString() ?? '',
      userPhone: json['userPhone']?.toString(),
      amountPaid: _asDouble(json['amountPaid']),
      paymentStatus: TicketPaymentStatus.fromJson(
        json['paymentStatus']?.toString(),
      ),
      isHost: json['isHost'] == true,
      paymentProofUrl: json['paymentProofUrl']?.toString(),
      paymentProofUploadedAt: json['paymentProofUploadedAt']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'participantId': participantId,
      'bookingId': bookingId,
      'userId': userId,
      'userName': userName,
      if (userPhone != null) 'userPhone': userPhone,
      'amountPaid': amountPaid,
      'paymentStatus': paymentStatus.toJson(),
      'isHost': isHost,
      if (paymentProofUrl != null) 'paymentProofUrl': paymentProofUrl,
      if (paymentProofUploadedAt != null)
        'paymentProofUploadedAt': paymentProofUploadedAt,
    };
  }
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }

  return <String, dynamic>{};
}

List<Map<String, dynamic>> _asList(dynamic value) {
  if (value is! List) {
    return <Map<String, dynamic>>[];
  }

  return value.map((item) => _asMap(item)).toList();
}

double _asDouble(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '') ?? 0;
}

double? _asNullableDouble(dynamic value) {
  if (value == null) {
    return null;
  }

  return _asDouble(value);
}

int _asInt(dynamic value) {
  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '') ?? 0;
}

int? _asNullableInt(dynamic value) {
  if (value == null) {
    return null;
  }

  return _asInt(value);
}
