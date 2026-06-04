class PaymentResponse {
  final String paymentId;
  final String transactionDate;
  final double amount;
  final String paymentMethod;
  final String paymentStatus;
  final String paymentType;
  final String? userId;
  final String? bookingId;
  final String? channel;
  final String? transactionCode;
  final int? orderCode;
  final String? payosPaymentLinkId;

  PaymentResponse({
    required this.paymentId,
    required this.transactionDate,
    required this.amount,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.paymentType,
    this.userId,
    this.bookingId,
    this.channel,
    this.transactionCode,
    this.orderCode,
    this.payosPaymentLinkId,
  });

  factory PaymentResponse.fromJson(Map<String, dynamic> json) {
    return PaymentResponse(
      paymentId: json['paymentId']?.toString() ?? '',
      transactionDate: json['transactionDate']?.toString() ?? '',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      paymentMethod: json['paymentMethod']?.toString() ?? '',
      paymentStatus: json['paymentStatus']?.toString() ?? '',
      paymentType: json['paymentType']?.toString() ?? '',
      userId: json['userId']?.toString(),
      bookingId: json['bookingId']?.toString(),
      channel: json['channel']?.toString(),
      transactionCode: json['transactionCode']?.toString(),
      orderCode: int.tryParse(json['orderCode']?.toString() ?? ''),
      payosPaymentLinkId: json['payosPaymentLinkId']?.toString(),
    );
  }
}

class RefundResponse {
  final String paymentId;
  final String userName;
  final String phone;
  final double amount;
  final String paymentMethod;
  final String orderCode;
  final String transactionDate;
  final String source; // "BOOKING" | "MATCH"
  final String referenceCode;
  final String bankName;
  final String accountNumber;
  final String accountHolderName;
  final String qrCodeUrl;

  RefundResponse({
    required this.paymentId,
    required this.userName,
    required this.phone,
    required this.amount,
    required this.paymentMethod,
    required this.orderCode,
    required this.transactionDate,
    required this.source,
    required this.referenceCode,
    required this.bankName,
    required this.accountNumber,
    required this.accountHolderName,
    required this.qrCodeUrl,
  });

  factory RefundResponse.fromJson(Map<String, dynamic> json) {
    return RefundResponse(
      paymentId: json['paymentId']?.toString() ?? '',
      userName: json['userName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      paymentMethod: json['paymentMethod']?.toString() ?? '',
      orderCode: json['orderCode']?.toString() ?? '',
      transactionDate: json['transactionDate']?.toString() ?? '',
      source: json['source']?.toString() ?? 'BOOKING',
      referenceCode: json['referenceCode']?.toString() ?? '',
      bankName: json['bankName']?.toString() ?? '',
      accountNumber: json['accountNumber']?.toString() ?? '',
      accountHolderName: json['accountHolderName']?.toString() ?? '',
      qrCodeUrl: json['qrCodeUrl']?.toString() ?? '',
    );
  }
}