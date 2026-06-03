import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../../models/category.dart';
import '../../models/rental_area.dart';
import '../../services/category_service.dart';
import '../../services/rental_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final String goongApiKey = dotenv.env['GOONG_API_KEY'] ?? '';
  final String goongMapKey = dotenv.env['GOONG_MAP_KEY'] ?? '';

  MapLibreMapController? _mapController;
  Circle? _userLocationCircle;

  String _activeFilter = 'Tất cả';
  List<RentalAreaResponse> _allAreas = [];

  List<CategoryResponse> _categories = [];

  @override
  void initState() {
    super.initState();
    _fetchCategories();
    _fetchAllAreas();
  }

  Future<void> _fetchCategories() async {
    try {
      final response = await categoryService.getAllCategories(size: 50);

      if (mounted) {
        setState(() {
          _categories = response.data;
        });
      }
    } catch (e) {
      debugPrint("Lỗi khi tải danh mục: $e");
    }
  }

  Future<void> _fetchAllAreas() async {
    try {
      final response = await rentalService.getAllRentalAreas(size: 100);

      List<dynamic> rawData = [];
      if (response is Map<String, dynamic> && response.containsKey('data')) {
        rawData = response['data'];
      } else if (response is List) {
        rawData = response;
      }

      final List<RentalAreaResponse> fetchedAreas = rawData
          .map(
            (json) => RentalAreaResponse.fromJson(json as Map<String, dynamic>),
          )
          .toList();

      if (mounted) {
        setState(() {
          _allAreas = fetchedAreas;
        });
        _drawMarkers();
      }
    } catch (e) {
      debugPrint("Lỗi khi tải danh sách sân: $e");
    }
  }

  void _onMapCreated(MapLibreMapController controller) {
    _mapController = controller;

    _mapController!.onCircleTapped.add((Circle circle) {
      final data = circle.data as Map;
      final areaId = data['id'];

      final area = _allAreas.firstWhere((a) => a.rentalAreaId == areaId);
      final theme = _getCategoryTheme(area);
      _showAreaDetails(area, theme);
    });

    _drawMarkers();
  }

  void _drawMarkers() {
    if (_mapController == null) return;

    _mapController!.clearCircles();

    List<RentalAreaResponse> filteredAreas = _activeFilter == 'Tất cả'
        ? _allAreas
        : _allAreas
              .where(
                (a) => a.rentalAreaName.toLowerCase().contains(
                  _activeFilter.toLowerCase(),
                ),
              )
              .toList();

    for (var area in filteredAreas) {
      // Đảm bảo có tọa độ mới vẽ marker
      if (area.latitude != null && area.longitude != null) {
        final theme = _getCategoryTheme(area);

        _mapController!.addCircle(
          CircleOptions(
            geometry: LatLng(area.latitude!, area.longitude!),
            circleColor: theme['hex'],
            circleRadius: 12.0,
            circleStrokeWidth: 2.0,
            circleStrokeColor: '#FFFFFF',
          ),
          {'id': area.rentalAreaId},
        );
      }
    }
  }

  Map<String, dynamic> _getCategoryTheme(RentalAreaResponse area) {
    final cat = area.rentalAreaName.toLowerCase();
    if (cat.contains('cầu lông'))
      return {
        'hex': '#F97316',
        'color': Colors.orange,
        'icon': Icons.sports_tennis,
      };
    if (cat.contains('pickleball'))
      return {
        'hex': '#A855F7',
        'color': Colors.purple,
        'icon': Icons.sports_tennis,
      };
    if (cat.contains('bóng đá'))
      return {
        'hex': '#22C55E',
        'color': Colors.green,
        'icon': Icons.sports_soccer,
      };
    if (cat.contains('quần vợt'))
      return {
        'hex': '#EAB308',
        'color': Colors.yellow.shade700,
        'icon': Icons.sports_tennis,
      };
    if (cat.contains('bóng chuyền'))
      return {
        'hex': '#3B82F6',
        'color': Colors.blue,
        'icon': Icons.sports_volleyball,
      };
    return {'hex': '#9CA3AF', 'color': Colors.grey, 'icon': Icons.location_on};
  }

  Future<List<Map<String, dynamic>>> _searchLocations(String query) async {
    if (query.isEmpty) return [];
    final url = Uri.parse(
      'https://rsapi.goong.io/Place/AutoComplete?api_key=$goongApiKey&input=$query',
    );
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK')
          return List<Map<String, dynamic>>.from(data['predictions']);
      }
    } catch (e) {
      debugPrint("Lỗi: $e");
    }
    return [];
  }

  Future<void> _handleSelectLocation(String placeId) async {
    final url = Uri.parse(
      'https://rsapi.goong.io/Place/Detail?api_key=$goongApiKey&place_id=$placeId',
    );
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK') {
          final loc = data['result']['geometry']['location'];
          final target = LatLng(loc['lat'], loc['lng']);

          _mapController?.animateCamera(
            CameraUpdate.newLatLngZoom(target, 15.0),
          );
        }
      }
    } catch (e) {
      debugPrint("Lỗi: $e");
    }
  }

  Future<void> _handleMyLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Vui lòng bật định vị!')));
      }
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }

    Position position = await Geolocator.getCurrentPosition();
    final target = LatLng(position.latitude, position.longitude);

    _mapController?.animateCamera(CameraUpdate.newLatLngZoom(target, 15.0));

    if (_userLocationCircle != null) {
      _mapController?.removeCircle(_userLocationCircle!);
    }
    _userLocationCircle = await _mapController?.addCircle(
      CircleOptions(
        geometry: target,
        circleColor: '#1D4ED8',
        circleRadius: 10.0,
        circleStrokeWidth: 3.0,
        circleStrokeColor: '#FFFFFF',
      ),
    );
  }

  void _showAreaDetails(RentalAreaResponse area, Map<String, dynamic> theme) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        // Trích xuất chuỗi địa chỉ an toàn (tránh null)
        final street = area.address?.street ?? '';
        final ward = area.address?.ward ?? '';
        final addressStr = [street, ward].where((e) => e.isNotEmpty).join(', ');

        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(theme['icon'], color: theme['color']),
                  const SizedBox(width: 8),
                  Text(
                    area.rentalAreaName,
                    style: TextStyle(
                      color: theme['color'],
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                addressStr.isNotEmpty
                    ? addressStr
                    : 'Chưa có thông tin địa chỉ',
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme['color'],
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: const Text(
                    'Xem chi tiết',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          MapLibreMap(
            styleString:
                'https://tiles.goong.io/assets/goong_map_web.json?api_key=$goongMapKey',
            initialCameraPosition: const CameraPosition(
              target: LatLng(10.80155, 106.65421),
              zoom: 13.0,
            ),
            onMapCreated: _onMapCreated,
            myLocationEnabled: false,
            compassEnabled: false,
          ),

          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 20,
            right: 20,
            child: Column(
              children: [
                Autocomplete<Map<String, dynamic>>(
                  optionsBuilder: (textEditingValue) =>
                      _searchLocations(textEditingValue.text),
                  displayStringForOption: (option) =>
                      option['description'] ?? '',
                  onSelected: (option) =>
                      _handleSelectLocation(option['place_id']),
                  fieldViewBuilder:
                      (context, controller, focusNode, onFieldSubmitted) {
                        return Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: const [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 6,
                                offset: Offset(0, 4),
                              ),
                            ],
                          ),
                          child: TextField(
                            controller: controller,
                            focusNode: focusNode,
                            decoration: const InputDecoration(
                              hintText: 'Tìm kiếm khu vực, tên đường...',
                              prefixIcon: Icon(
                                Icons.search,
                                color: Colors.orange,
                              ),
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 15,
                              ),
                            ),
                          ),
                        );
                      },
                ),
                const SizedBox(height: 15),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('Tất cả'),
                      ..._categories.map(
                        (c) => _buildFilterChip(c.categoryName),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

      Positioned(
        bottom: MediaQuery.of(context).padding.bottom + 110,
        right: 20,
        child: Column(
          children: [
            FloatingActionButton(
              heroTag: 'list_btn',
              backgroundColor: const Color(0xFF9156F1),
              onPressed: () {},
              child: const Icon(
                Icons.format_list_bulleted,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 14),
            FloatingActionButton(
              heroTag: 'location_btn',
              backgroundColor: Colors.white,
              onPressed: _handleMyLocation,
              child: const Icon(
                Icons.my_location,
                color: Color(0xFF9156F1),
              ),
            ),
          ],
        ),
      ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String title) {
    bool isActive = _activeFilter == title;
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: ChoiceChip(
        label: Text(
          title,
          style: TextStyle(
            color: isActive ? Colors.orange : Colors.grey.shade700,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        selected: isActive,
        onSelected: (selected) {
          if (selected) {
            setState(() => _activeFilter = title);
            _drawMarkers();
          }
        },
        selectedColor: Colors.white,
        backgroundColor: Colors.white,
        side: BorderSide(
          color: isActive ? Colors.orange : Colors.grey.shade300,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        showCheckmark: false,
      ),
    );
  }
}
