import 'package:mobile/models/post.dart';

import 'user.dart';

class MatchRequest {
  final String? courtId;
  final String? categoryId;
  final String street;
  final String ward;
  final int cityId;
  final String startTime;
  final String endTime;
  final int maxPlayers;
  final int minPlayersToStart;
  final bool isRecurring;
  final String? recurringType;
  final String? dayOfWeek;
  final String? endDate;
  final String matchType;
  final int? minRank;
  final int? maxRank;
  final String? note;
  final int? playerCount;

  MatchRequest({
    this.courtId,
    required this.categoryId,
    required this.street,
    required this.ward,
    required this.cityId,
    required this.startTime,
    required this.endTime,
    required this.maxPlayers,
    required this.minPlayersToStart,
    required this.isRecurring,
    this.recurringType,
    this.dayOfWeek,
    this.endDate,
    required this.matchType,
    this.minRank,
    this.maxRank,
    this.note,
    this.playerCount,
  });

  Map<String, dynamic> toJson() {
    return {
      'courtId': courtId,
      'categoryId': categoryId,
      'street': street,
      'ward': ward,
      'cityId': cityId,
      'startTime': startTime,
      'endTime': endTime,
      'maxPlayers': maxPlayers,
      'minPlayersToStart': minPlayersToStart,
      'isRecurring': isRecurring,
      'recurringType': recurringType,
      'dayOfWeek': dayOfWeek,
      'endDate': endDate,
      'matchType': matchType,
      'minRank': minRank,
      'maxRank': maxRank,
      'note': note,
      'playerCount': playerCount ?? 1,
    };
  }
}

class MatchReportResponse {
  final String reportId;
  final String reporterName;
  final String reasonType;
  final String description;
  final String status;

  MatchReportResponse({
    required this.reportId,
    required this.reporterName,
    required this.reasonType,
    required this.description,
    required this.status,
  });

  factory MatchReportResponse.fromJson(Map<String, dynamic> json) {
    return MatchReportResponse(
      reportId: json['reportId']?.toString() ?? '',
      reporterName: json['reporterName']?.toString() ?? '',
      reasonType: json['reasonType']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
    );
  }
}

class MatchResponse {
  final String matchId;
  final String? roomCode;
  final String title;
  final String description;
  final String courtName;
  final double courtPrice;
  final AddressResponse? address;
  final String categoryName;
  final String startTime;
  final String endTime;
  final int maxPlayers;
  final int currentPlayers;
  final int remainingSlots;
  final double price;
  final String status;
  final UserResponse? host;
  final UserResponse? ownerCourt; // Đã chuyển thành nullable cho an toàn
  final String? ownerCourtPhone; // Thêm field lấy sđt chủ sân
  final double hostRating;
  final String level;
  final bool hasCourt;
  final List<UserResponse> participants;
  final bool isRecurring;
  final String recurringType;
  final String dayOfWeek;
  final String endDate;
  final String matchType;
  final String? note;
  final int? minRank;
  final int? maxRank;
  final bool isFull;
  final bool? isCancelled;
  final List<MatchReportResponse>? reports;

  MatchResponse({
    required this.matchId,
    this.roomCode,
    required this.title,
    required this.description,
    required this.courtName,
    required this.courtPrice,
    this.address,
    required this.categoryName,
    required this.startTime,
    required this.endTime,
    required this.maxPlayers,
    required this.currentPlayers,
    required this.remainingSlots,
    required this.price,
    required this.status,
    this.host,
    this.ownerCourt,
    this.ownerCourtPhone,
    required this.hostRating,
    required this.level,
    required this.hasCourt,
    required this.participants,
    required this.isRecurring,
    required this.recurringType,
    required this.dayOfWeek,
    required this.endDate,
    required this.matchType,
    this.note,
    this.minRank,
    this.maxRank,
    required this.isFull,
    this.isCancelled,
    this.reports,
  });

  factory MatchResponse.fromJson(Map<String, dynamic> json) {
    return MatchResponse(
      matchId: json['matchId']?.toString() ?? '',
      roomCode: json['roomCode']?.toString(),
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      courtName: json['courtName']?.toString() ?? '',
      courtPrice: double.tryParse(json['courtPrice']?.toString() ?? '0') ?? 0.0,
      address: json['address'] != null
          ? AddressResponse.fromJson(json['address'])
          : null,
      categoryName: json['categoryName']?.toString() ?? '',
      startTime: json['startTime']?.toString() ?? '',
      endTime: json['endTime']?.toString() ?? '',
      maxPlayers: int.tryParse(json['maxPlayers']?.toString() ?? '0') ?? 0,
      currentPlayers:
          int.tryParse(json['currentPlayers']?.toString() ?? '0') ?? 0,
      remainingSlots:
          int.tryParse(json['remainingSlots']?.toString() ?? '0') ?? 0,
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      status: json['status']?.toString() ?? '',
      host: json['host'] != null ? UserResponse.fromJson(json['host']) : null,
      ownerCourt: json['ownerCourt'] != null
          ? UserResponse.fromJson(json['ownerCourt'])
          : null,
      ownerCourtPhone: json['ownerCourt']?['phone']?.toString(),
      // Map sđt từ json
      hostRating: double.tryParse(json['hostRating']?.toString() ?? '0') ?? 0.0,
      level: json['level']?.toString() ?? '',
      hasCourt: json['hasCourt'] as bool? ?? false,
      participants: json['participants'] != null
          ? (json['participants'] as List)
                .map((i) => UserResponse.fromJson(i))
                .toList()
          : [],
      isRecurring: json['isRecurring'] as bool? ?? false,
      recurringType: json['recurringType']?.toString() ?? '',
      dayOfWeek: json['dayOfWeek']?.toString() ?? '',
      endDate: json['endDate']?.toString() ?? '',
      matchType: json['matchType']?.toString() ?? 'NORMAL',
      note: json['note']?.toString(),
      minRank: int.tryParse(json['minRank']?.toString() ?? ''),
      maxRank: int.tryParse(json['maxRank']?.toString() ?? ''),
      isFull: json['isFull'] as bool? ?? false,
      reports: json['reports'] != null
          ? (json['reports'] as List)
                .map((i) => MatchReportResponse.fromJson(i))
                .toList()
          : null,
    );
  }
}

class ReportRequest {
  final String matchId;
  final List<String>? reportedUserIds;
  final String reasonType;
  final String description;
  final List<String>? evidenceImages;

  ReportRequest({
    required this.matchId,
    this.reportedUserIds,
    required this.reasonType,
    required this.description,
    this.evidenceImages,
  });

  Map<String, dynamic> toJson() {
    return {
      'matchId': matchId,
      'reportedUserIds': reportedUserIds,
      'reasonType': reasonType,
      'description': description,
      'evidenceImages': evidenceImages,
    };
  }
}
