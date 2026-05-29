import '../models/page_response.dart';
import '../models/category.dart';
import '../config/api_client.dart';

class CategoryService {
  Future<PageResponse<CategoryResponse>> getAllCategories({
    int page = 1,
    int size = 10,
    String? keyword,
    String? from,
    String? to,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'size': size,
      if (keyword != null && keyword.isNotEmpty) 'keyword': keyword,
      if (from != null && from.isNotEmpty) 'from': from,
      if (to != null && to.isNotEmpty) 'to': to,
    };

    final res = await apiClient.get('/categories', queryParameters: params);

    return PageResponse<CategoryResponse>.fromJson(
      res.data['result'],
      (json) => CategoryResponse.fromJson(json),
    );
  }

  Future<CategoryResponse> getCategoryById(String categoryId) async {
    final res = await apiClient.get('/categories/$categoryId');
    return CategoryResponse.fromJson(res.data['result']);
  }

  Future<CategoryResponse> createCategory(Map<String, dynamic> request) async {
    final res = await apiClient.post('/categories', data: request);
    return CategoryResponse.fromJson(res.data['result']);
  }

  Future<CategoryResponse> updateCategory(
    String categoryId,
    Map<String, dynamic> request,
  ) async {
    final res = await apiClient.put('/categories/$categoryId', data: request);
    return CategoryResponse.fromJson(res.data['result']);
  }

  Future<void> deleteCategory(String categoryId) async {
    await apiClient.delete('/categories/$categoryId');
  }
}

final categoryService = CategoryService();
