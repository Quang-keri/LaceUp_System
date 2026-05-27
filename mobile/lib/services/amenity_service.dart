import '../models/amenity.dart';
import '../config/api_client.dart';
class AmenityService {
  Future<List<AmenityResponse>> getAllAmenities() async {
    final res = await apiClient.get('/amenities');

    final List data = res.data['result'] ?? [];

    return data.map((e) => AmenityResponse.fromJson(e)).toList();
  }

  Future<AmenityResponse> getAmenityById(int id) async {
    final res = await apiClient.get('/amenities/$id');

    return AmenityResponse.fromJson(res.data['result']);
  }
}

final amenityService = AmenityService();