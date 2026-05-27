class AmenityResponse {
  final int amenityId;
  final String amenityName;
  final String? iconKey;

  AmenityResponse({
    required this.amenityId,
    required this.amenityName,
    this.iconKey,
  });

  factory AmenityResponse.fromJson(Map<String, dynamic> json) {
    return AmenityResponse(
      amenityId: json['amenityId'] ?? 0,
      amenityName: json['amenityName'] ?? '',
      iconKey: json['iconKey'],
    );
  }
}