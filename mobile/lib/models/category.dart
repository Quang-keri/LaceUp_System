class CategoryResponse {
  final int categoryId;
  final String categoryName;

  CategoryResponse({required this.categoryId, required this.categoryName});

  factory CategoryResponse.fromJson(Map<String, dynamic> json) {
    return CategoryResponse(
      categoryId: int.tryParse(json['categoryId']?.toString() ?? '0') ?? 0,
      categoryName: json['categoryName']?.toString() ?? '',
    );
  }
}
