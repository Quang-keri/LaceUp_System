class NewsImage {
  final String imageUrl;
  final bool isCover;

  NewsImage({
    required this.imageUrl,
    required this.isCover,
  });

  factory NewsImage.fromJson(Map<String, dynamic> json) {
    return NewsImage(
      imageUrl: json['imageUrl']?.toString() ?? '',
      isCover: json['isCover'] == true,
    );
  }
}

class NewsModel {
  final dynamic id;
  final String title;
  final String content;
  final String? imageUrl;
  final String? createdAt;
  final List<NewsImage> images;

  NewsModel({
    required this.id,
    required this.title,
    required this.content,
    this.imageUrl,
    this.createdAt,
    required this.images,
  });

  factory NewsModel.fromJson(Map<String, dynamic> json) {
    return NewsModel(
      id: json['id'],
      title: json['title']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString(),
      createdAt: json['createdAt']?.toString(),
      images: (json['images'] as List? ?? [])
          .map((e) => NewsImage.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
    );
  }

  String get coverImage {
    final cover = images.where((img) => img.isCover && img.imageUrl.isNotEmpty);

    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return imageUrl!;
    }

    if (cover.isNotEmpty) {
      return cover.first.imageUrl;
    }

    if (images.isNotEmpty && images.first.imageUrl.isNotEmpty) {
      return images.first.imageUrl;
    }

    return '';
  }
}