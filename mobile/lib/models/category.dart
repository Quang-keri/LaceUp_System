class CategoryResponse {
  final String categoryId;
  final String categoryName;

  CategoryResponse({required this.categoryId, required this.categoryName});

  factory CategoryResponse.fromJson(Map<String, dynamic> json) {
    return CategoryResponse(
      categoryId: json['categoryId']?.toString() ?? '',
      categoryName: json['categoryName']?.toString() ?? '',
    );
  }
}