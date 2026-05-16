class CourtImageResponse {
  final String? courtImageId;
  final String imageUrl;
  final String? createdAt;

  CourtImageResponse({
    this.courtImageId,
    required this.imageUrl,
    this.createdAt,
  });

  factory CourtImageResponse.fromJson(Map<String, dynamic> json) {
    return CourtImageResponse(
      courtImageId: json['courtImageId']?.toString(),
      imageUrl: json['imageUrl']?.toString() ?? '',
      createdAt: json['createdAt']?.toString(),
    );
  }
}