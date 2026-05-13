class PageResponse<T> {
  final int currentPage;
  final int totalPages;
  final int pageSize;
  final int totalElements;
  final List<T> data;

  PageResponse({
    required this.currentPage,
    required this.totalPages,
    required this.pageSize,
    required this.totalElements,
    required this.data,
  });

  factory PageResponse.fromJson(Map<String, dynamic> json, T Function(dynamic) fromJsonT) {
    return PageResponse(
      currentPage: json['currentPage'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
      pageSize: json['pageSize'] ?? 0,
      totalElements: json['totalElements'] ?? 0,
      data: (json['data'] as List).map((i) => fromJsonT(i)).toList(),
    );
  }
}