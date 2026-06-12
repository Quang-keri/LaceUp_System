class ReviewData {
  final String? reviewId;
  final int rating;
  final String comment;
  final DateTime? createdAt;
  final String userName;

  const ReviewData({
    this.reviewId,
    required this.rating,
    required this.comment,
    this.createdAt,
    required this.userName,
  });

  factory ReviewData.fromJson(Map<String, dynamic> json) {
    return ReviewData(
      reviewId: json['reviewId']?.toString() ?? json['id']?.toString(),
      rating: _parseInt(json['rating']),
      comment: json['comment']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      userName: json['userName']?.toString().trim().isNotEmpty == true
          ? json['userName'].toString()
          : 'Khách hàng',
    );
  }

  static int _parseInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}

class ReviewPage {
  final List<ReviewData> data;
  final int totalElements;

  const ReviewPage({required this.data, required this.totalElements});

  factory ReviewPage.fromJson(Map<String, dynamic> json) {
    final dynamic rawData =
        json['data'] ?? json['content'] ?? json['items'] ?? [];

    final List<ReviewData> reviews = rawData is List
        ? rawData
              .whereType<Map>()
              .map(
                (item) => ReviewData.fromJson(Map<String, dynamic>.from(item)),
              )
              .toList()
        : [];

    final dynamic rawTotal =
        json['totalElements'] ?? json['total'] ?? reviews.length;

    final int totalElements = rawTotal is num
        ? rawTotal.toInt()
        : int.tryParse(rawTotal.toString()) ?? reviews.length;

    return ReviewPage(data: reviews, totalElements: totalElements);
  }
}
