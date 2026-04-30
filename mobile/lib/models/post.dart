class PostResponse {
  final String postId;
  final String title;
  final String description;
  final String postStatus;
  final String? createdAt;

  final String courtId;
  final String courtName;
  final double price; // Vẫn giữ tên biến là price trong Flutter cho gọn
  final String courtCoverImageUrl;

  final String rentalAreaId;
  final String rentalAreaName;
  final String address;

  PostResponse({
    required this.postId,
    required this.title,
    required this.description,
    required this.postStatus,
    this.createdAt,
    required this.courtId,
    required this.courtName,
    required this.price,
    required this.courtCoverImageUrl,
    required this.rentalAreaId,
    required this.rentalAreaName,
    required this.address,
  });

  factory PostResponse.fromJson(Map<String, dynamic> json) {
    // 1. XỬ LÝ ĐỊA CHỈ LỒNG NHAU (Nested JSON)
    String fullAddress = '';
    if (json['address'] != null && json['address'] is Map) {
      final addressData = json['address'];
      final street = addressData['street'] ?? '';
      final ward = addressData['ward'] ?? '';
      final district = addressData['district'] ?? '';
      final cityName = addressData['city']?['cityName'] ?? ''; // Lấy sâu vào trong object city

      // Ghép các thành phần lại thành 1 chuỗi, cách nhau bởi dấu phẩy
      // Lệnh where để loại bỏ những khoảng trắng nếu API thiếu dữ liệu
      fullAddress = [street, ward, district, cityName]
          .where((element) => element.toString().trim().isNotEmpty)
          .join(', ');
    } else {
      // Đề phòng trường hợp đôi khi backend lại trả về string
      fullAddress = json['address']?.toString() ?? '';
    }

    return PostResponse(
      postId: json['postId']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      postStatus: json['postStatus']?.toString() ?? '',
      createdAt: json['createdAt']?.toString(),

      courtId: json['courtId']?.toString() ?? '',
      courtName: json['courtName']?.toString() ?? '',

      // 2. SỬA 'price' THÀNH 'minPrice' THEO ĐÚNG JSON
      price: double.tryParse(json['minPrice']?.toString() ?? '0') ?? 0.0,

      courtCoverImageUrl: json['courtCoverImageUrl']?.toString() ?? '',

      rentalAreaId: json['rentalAreaId']?.toString() ?? '',
      rentalAreaName: json['rentalAreaName']?.toString() ?? '',

      // Gán chuỗi địa chỉ đã được xử lý ở trên
      address: fullAddress,
    );
  }
}