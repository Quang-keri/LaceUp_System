import 'bank_account.dart';

enum Gender { MALE, FEMALE, OTHER }

extension GenderExtension on Gender {
  String get name => toString().split('.').last;
}

Gender? _parseGender(String? value) {
  if (value == null) return null;
  switch (value.toUpperCase()) {
    case 'MALE':
      return Gender.MALE;
    case 'FEMALE':
      return Gender.FEMALE;
    case 'OTHER':
      return Gender.OTHER;
    default:
      return null;
  }
}

class CategoryRankResponse {
  final int categoryId;
  final String categoryName;
  final double rankPoint;
  final String displayRank;
  final int totalMatches;
  final int totalWins;
  final int currentWinStreak;
  final double winRate;

  CategoryRankResponse({
    required this.categoryId,
    required this.categoryName,
    required this.rankPoint,
    required this.displayRank,
    required this.totalMatches,
    required this.totalWins,
    required this.currentWinStreak,
    required this.winRate,
  });

  factory CategoryRankResponse.fromJson(Map<String, dynamic> json) {
    return CategoryRankResponse(
      categoryId: json['categoryId'] ?? 0,
      categoryName: json['categoryName'] ?? '',
      rankPoint: (json['rankPoint'] ?? 0).toDouble(),
      displayRank: json['displayRank'] ?? '',
      totalMatches: json['totalMatches'] ?? 0,
      totalWins: json['totalWins'] ?? 0,
      currentWinStreak: json['currentWinStreak'] ?? 0,
      winRate: (json['winRate'] ?? 0).toDouble(),
    );
  }
}

class UserResponse {
  final String userId;
  final String userName;
  final String email;
  final Gender gender;
  final String phone;
  final String dateOfBirth;
  final int age;
  final String role;
  final String createdAt;
  final String updatedAt;
  final bool active;
  final List<String>? permissions;

  // Tạm để dynamic, nếu bạn có file permission_model.dart thì thay bằng List<PermissionResponse>
  final List<dynamic>? extraPermissions;
  final bool? isDepositConfirmed;
  final int? teamNumber;
  final List<CategoryRankResponse>? categoryRanks;

  final String? registrationId;
  final double? amountDue;
  final bool? isPaid;
  final int? playerCount;
  final bool? isCancelled;
  final String? paymentStatus;

  final BankAccountResponse? bankAccount;

  UserResponse({
    required this.userId,
    required this.userName,
    required this.email,
    required this.gender,
    required this.phone,
    required this.dateOfBirth,
    required this.age,
    required this.role,
    required this.createdAt,
    required this.updatedAt,
    required this.active,
    this.permissions,
    this.extraPermissions,
    this.isDepositConfirmed,
    this.teamNumber,
    this.categoryRanks,

    this.registrationId,
    this.amountDue,
    this.isPaid,
    this.playerCount,
    this.bankAccount,
    this.isCancelled,
    this.paymentStatus
  });

  factory UserResponse.fromJson(Map<String, dynamic> json) {
    return UserResponse(
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      email: json['email'] ?? '',
      gender: _parseGender(json['gender']) ?? Gender.OTHER,
      phone: json['phone'] ?? '',
      dateOfBirth: json['dateOfBirth'] ?? '',
      age: json['age'] ?? 0,
      role: json['role'] ?? '',
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
      active: json['active'] ?? false,
      permissions: json['permissions'] != null
          ? List<String>.from(json['permissions'])
          : null,
      extraPermissions: json['extraPermissions'],
      isDepositConfirmed: json['isDepositConfirmed'],
      teamNumber: json['teamNumber'],
      categoryRanks: json['categoryRanks'] != null
          ? (json['categoryRanks'] as List)
                .map((i) => CategoryRankResponse.fromJson(i))
                .toList()
          : null,

      registrationId: json['registrationId']?.toString(),
      amountDue: double.tryParse(json['amountDue']?.toString() ?? '0'),
      isPaid: json['isPaid'] as bool?,
      playerCount: int.tryParse(json['playerCount']?.toString() ?? '1'),
      isCancelled: json['isCancelled'] as bool? ?? false,
      paymentStatus: json['paymentStatus'],
      bankAccount: json['bankAccount'] != null
          ? BankAccountResponse.fromJson(json['bankAccount'])
          : null,
    );
  }
}

class UserDashboardResponse {
  final String userId;
  final String userName;
  final String? avatarUrl;
  final int totalMatches;
  final int totalWins;
  final double winRate;
  final List<CategoryRankResponse> categoryRanks;

  UserDashboardResponse({
    required this.userId,
    required this.userName,
    this.avatarUrl,
    required this.totalMatches,
    required this.totalWins,
    required this.winRate,
    required this.categoryRanks,
  });

  factory UserDashboardResponse.fromJson(Map<String, dynamic> json) {
    return UserDashboardResponse(
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      avatarUrl: json['avatarUrl'],
      totalMatches: json['totalMatches'] ?? 0,
      totalWins: json['totalWins'] ?? 0,
      winRate: (json['winRate'] ?? 0).toDouble(),
      categoryRanks: json['categoryRanks'] != null
          ? (json['categoryRanks'] as List)
                .map((i) => CategoryRankResponse.fromJson(i))
                .toList()
          : [],
    );
  }
}

// ----------------------------------------------------
// 5. Create User Request (Dùng để gửi đi nên chỉ cần toJson)
// ----------------------------------------------------
class CreateUserRequest {
  final String userName;
  final Gender? gender;
  final String email;
  final String? password;
  final String? phone;
  final String dateOfBirth;
  final String roleName;
  final String? otp;

  CreateUserRequest({
    required this.userName,
    this.gender,
    required this.email,
    this.password,
    this.phone,
    required this.dateOfBirth,
    required this.roleName,
    this.otp,
  });

  Map<String, dynamic> toJson() {
    return {
      'userName': userName,
      if (gender != null) 'gender': gender!.name,
      'email': email,
      if (password != null) 'password': password,
      if (phone != null) 'phone': phone,
      'dateOfBirth': dateOfBirth,
      'roleName': roleName,
      if (otp != null) 'otp': otp,
    };
  }
}

// ----------------------------------------------------
// 6. Update User Request (Dùng để gửi đi nên chỉ cần toJson)
// ----------------------------------------------------
class UpdateUserRequest {
  final String? userName;
  final String? phone;
  final Gender? gender;
  final String? dateOfBirth;

  UpdateUserRequest({this.userName, this.phone, this.gender, this.dateOfBirth});

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {};
    if (userName != null) data['userName'] = userName;
    if (phone != null) data['phone'] = phone;
    if (gender != null) data['gender'] = gender!.name;
    if (dateOfBirth != null) data['dateOfBirth'] = dateOfBirth;
    return data;
  }
}
