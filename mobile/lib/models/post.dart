class PostResponse {
  final String postId;
  final String title;
  final String? description;
  final String postStatus;
  final String courtId;
  final String courtName;
  final double? minPrice;
  final String? courtCoverImageUrl;
  final String rentalAreaId;
  final String rentalAreaName;
  final AddressResponse? address;
  final double? avgRating;

  PostResponse({
    required this.postId,
    required this.title,
    this.description,
    required this.postStatus,
    required this.courtId,
    required this.courtName,
    this.minPrice,
    this.courtCoverImageUrl,
    required this.rentalAreaId,
    required this.rentalAreaName,
    this.address,
    this.avgRating,
  });

  factory PostResponse.fromJson(Map<String, dynamic> json) {
    return PostResponse(
      postId: json['postId'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      postStatus: json['postStatus'] ?? '',
      courtId: json['courtId'] ?? '',
      courtName: json['courtName'] ?? '',
      minPrice: json['minPrice'] != null
          ? double.tryParse(json['minPrice'].toString())
          : null,
      courtCoverImageUrl: json['courtCoverImageUrl'],
      rentalAreaId: json['rentalAreaId'] ?? '',
      rentalAreaName: json['rentalAreaName'] ?? '',
      address: json['address'] != null
          ? AddressResponse.fromJson(json['address'])
          : null,
      avgRating: json['avgRating'] != null
          ? double.tryParse(json['avgRating'].toString())
          : null,
    );
  }
}

class AddressResponse {
  final String? street;
  final String? ward;
  final CityResponse? city;

  AddressResponse({
    this.street,
    this.ward,
    this.city,
  });

  factory AddressResponse.fromJson(Map<String, dynamic> json) {
    return AddressResponse(
      street: json['street'],
      ward: json['ward'],
      city: json['city'] != null
          ? CityResponse.fromJson(json['city'])
          : null,
    );
  }

  String get fullAddress {
    return [
      street,
      ward,
      city?.cityName,
    ].where((e) => e != null && e.toString().isNotEmpty).join(', ');
  }
}

class CityResponse {
  final int? cityId;
  final String? cityName;

  CityResponse({
    this.cityId,
    this.cityName,
  });

  factory CityResponse.fromJson(Map<String, dynamic> json) {
    return CityResponse(
      cityId: json['cityId'],
      cityName: json['cityName'],
    );
  }
}