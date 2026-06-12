import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:maplibre_gl/maplibre_gl.dart';

import '../../models/category.dart';
import '../../models/rental_area.dart';
import '../../services/category_service.dart';
import '../../services/rental_service.dart';
import '../area/area_detail/rental_area_detail_screen.dart';

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

  bool _isMapStyleLoaded = false;
  bool _markerImagesReady = false;
  bool _isPreparingMapStyle = true;

  String? _cleanMapStyle;

  final Set<String> _registeredMarkerImages = {};

  String _activeFilter = 'Tất cả';
  List<RentalAreaResponse> _allAreas = [];
  List<CategoryResponse> _categories = [];

  String get _goongStyleUrl =>
      'https://tiles.goong.io/assets/goong_map_web.json'
      '?api_key=$goongMapKey';

  @override
  void initState() {
    super.initState();
    _prepareCleanMapStyle();
    _fetchCategories();
    _fetchAllAreas();
  }

  Future<void> _prepareCleanMapStyle() async {
    String styleToUse = _goongStyleUrl;

    try {
      final response = await http.get(Uri.parse(_goongStyleUrl));

      if (response.statusCode == 200) {
        final decodedStyle = jsonDecode(response.body);

        if (decodedStyle is Map<String, dynamic>) {
          final rawLayers = decodedStyle['layers'];

          if (rawLayers is List) {
            decodedStyle['layers'] = rawLayers.where((rawLayer) {
              if (rawLayer is! Map) return true;

              final layerType =
                  rawLayer['type']?.toString().toLowerCase() ?? '';

              // Giữ nguyên nền, đường, sông, tòa nhà...
              if (layerType != 'symbol') return true;

              final layerId = rawLayer['id']?.toString().toLowerCase() ?? '';
              final sourceLayer =
                  rawLayer['source-layer']?.toString().toLowerCase() ?? '';

              final layerInfo = '$layerId $sourceLayer';

              // Chỉ giữ tên đường để người dùng vẫn dễ định hướng.
              // Loại bỏ tên phường, khu dân cư, sân bay, trường học,
              // quán ăn, bệnh viện, cửa hàng và các POI mặc định.
              final isRoadLabel =
                  layerInfo.contains('road') ||
                  layerInfo.contains('street') ||
                  layerInfo.contains('highway');

              return isRoadLabel;
            }).toList();
          }

          styleToUse = jsonEncode(decodedStyle);
        }
      }
    } catch (e) {
      debugPrint('Không thể tạo style bản đồ rút gọn: $e');
    }

    if (!mounted) return;

    setState(() {
      _cleanMapStyle = styleToUse;
      _isPreparingMapStyle = false;
    });
  }

  Future<void> _fetchCategories() async {
    try {
      final response = await categoryService.getAllCategories(size: 50);

      if (!mounted) return;

      setState(() {
        _categories = response.data;
      });
    } catch (e) {
      debugPrint('Lỗi khi tải danh mục: $e');
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

      final fetchedAreas = rawData
          .map(
            (json) => RentalAreaResponse.fromJson(json as Map<String, dynamic>),
          )
          .toList();

      if (!mounted) return;

      setState(() {
        _allAreas = fetchedAreas;
      });

      if (_isMapStyleLoaded) {
        await _drawMarkers();
      }
    } catch (e) {
      debugPrint('Lỗi khi tải danh sách sân: $e');
    }
  }

  void _onMapCreated(MapLibreMapController controller) {
    _mapController = controller;

    controller.onSymbolTapped.add((Symbol symbol) {
      final rawData = symbol.data;

      if (rawData is! Map) return;

      final areaId = rawData?['id'];

      final matchedAreas = _allAreas.where(
        (area) => area.rentalAreaId == areaId,
      );

      if (matchedAreas.isEmpty) return;

      final area = matchedAreas.first;
      final theme = _getCategoryTheme(area);

      _showAreaDetails(area, theme);
    });
  }

  Future<void> _onStyleLoaded() async {
    _isMapStyleLoaded = true;

    await _hideUnrelatedMapLabels();
    await _prepareMarkerImages();
    await _drawMarkers();
  }

  Future<void> _hideUnrelatedMapLabels() async {
    final controller = _mapController;
    if (controller == null) return;

    // Ẩn bớt các label/POI không liên quan để map đỡ rối mắt.
    // Vì id layer có thể khác nhau tùy style Goong, nên bọc try/catch từng layer.
    const candidateLayerIds = <String>[
      'poi-label',
      'poi_label',
      'poi',
      'poi-level-1',
      'poi-level-2',
      'poi-level-3',
      'poi-level-4',
      'poi-scalerank1',
      'poi-scalerank2',
      'poi-scalerank3',
      'transit-label',
      'transit-label-lg',
      'transit-label-sm',
      'transit',
      'airport-label',
      'airport_label',
      'airport',
      'aeroway-label',
      'settlement-label',
      'settlement-subdivision-label',
      'settlement-neighborhood-label',
      'settlement-minor-label',
      'place-label',
      'place_label',
      'place-city-label',
      'place-town-label',
      'place-village-label',
      'landmark-label',
      'building-label',
      'building-number-label',
      'school-label',
      'hospital-label',
      'shop-label',
      'restaurant-label',
      'business-label',
    ];

    for (final layerId in candidateLayerIds) {
      try {
        await controller.setLayerVisibility(layerId, false);
      } catch (_) {
        // Bỏ qua các layer không tồn tại trong style hiện tại.
      }
    }
  }

  Future<void> _prepareMarkerImages() async {
    final controller = _mapController;
    if (controller == null || !_isMapStyleLoaded) return;
    if (_markerImagesReady) return;

    final markerConfigs = <String, Map<String, dynamic>>{
      'marker_badminton': {'color': Colors.orange, 'icon': Icons.sports_tennis},
      'marker_soccer': {'color': Colors.green, 'icon': Icons.sports_soccer},
      'marker_volleyball': {
        'color': Colors.blue,
        'icon': Icons.sports_volleyball,
      },
      'marker_pickleball': {
        'color': Colors.purple,
        'icon': Icons.sports_tennis,
      },
      'marker_tennis': {
        'color': Colors.amber.shade700,
        'icon': Icons.sports_tennis,
      },
      'marker_default': {'color': Colors.grey, 'icon': Icons.place_rounded},
    };

    for (final entry in markerConfigs.entries) {
      if (_registeredMarkerImages.contains(entry.key)) continue;

      final bytes = await _createMarkerIconBytes(
        icon: entry.value['icon'] as IconData,
        color: entry.value['color'] as Color,
      );

      await controller.addImage(entry.key, bytes);
      _registeredMarkerImages.add(entry.key);
    }

    await controller.setSymbolIconAllowOverlap(true);
    await controller.setSymbolIconIgnorePlacement(true);

    _markerImagesReady = true;
  }

  Future<Uint8List> _createMarkerIconBytes({
    required IconData icon,
    required Color color,
  }) async {
    const double canvasSize = 96;
    const double circleRadius = 30;

    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    final center = const Offset(canvasSize / 2, canvasSize / 2);

    final shadowPaint = Paint()
      ..color = Colors.black.withOpacity(0.18)
      ..maskFilter = const ui.MaskFilter.blur(ui.BlurStyle.normal, 6);

    canvas.drawCircle(center.translate(0, 4), circleRadius, shadowPaint);

    final fillPaint = Paint()..color = color;
    canvas.drawCircle(center, circleRadius, fillPaint);

    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5;

    canvas.drawCircle(center, circleRadius, borderPaint);

    final textPainter = TextPainter(
      textDirection: TextDirection.ltr,
      text: TextSpan(
        text: String.fromCharCode(icon.codePoint),
        style: TextStyle(
          fontSize: 34,
          fontFamily: icon.fontFamily,
          package: icon.fontPackage,
          color: Colors.white,
        ),
      ),
    )..layout();

    final textOffset = Offset(
      center.dx - (textPainter.width / 2),
      center.dy - (textPainter.height / 2),
    );

    textPainter.paint(canvas, textOffset);

    final image = await recorder.endRecording().toImage(
      canvasSize.toInt(),
      canvasSize.toInt(),
    );

    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

    return byteData!.buffer.asUint8List();
  }

  String _getMarkerImageName(RentalAreaResponse area) {
    final categoryName = area.rentalAreaName.toLowerCase();

    if (categoryName.contains('cầu lông')) return 'marker_badminton';
    if (categoryName.contains('bóng đá')) return 'marker_soccer';
    if (categoryName.contains('bóng chuyền')) return 'marker_volleyball';
    if (categoryName.contains('pickleball')) return 'marker_pickleball';
    if (categoryName.contains('quần vợt')) return 'marker_tennis';

    return 'marker_default';
  }

  Future<void> _drawMarkers() async {
    final controller = _mapController;

    if (controller == null || !_isMapStyleLoaded) return;

    await _prepareMarkerImages();
    await controller.clearSymbols();

    final filteredAreas = _activeFilter == 'Tất cả'
        ? _allAreas
        : _allAreas
              .where(
                (area) => area.rentalAreaName.toLowerCase().contains(
                  _activeFilter.toLowerCase(),
                ),
              )
              .toList();

    for (final area in filteredAreas) {
      if (area.latitude == null || area.longitude == null) continue;

      await controller.addSymbol(
        SymbolOptions(
          geometry: LatLng(area.latitude!, area.longitude!),
          iconImage: _getMarkerImageName(area),
          iconSize: 0.75,
        ),
        {'id': area.rentalAreaId},
      );
    }
  }

  Map<String, dynamic> _getCategoryTheme(RentalAreaResponse area) {
    final categoryName = area.rentalAreaName.toLowerCase();

    if (categoryName.contains('cầu lông')) {
      return {
        'hex': '#F97316',
        'color': Colors.orange,
        'icon': Icons.sports_tennis,
      };
    }

    if (categoryName.contains('pickleball')) {
      return {
        'hex': '#A855F7',
        'color': Colors.purple,
        'icon': Icons.sports_tennis,
      };
    }

    if (categoryName.contains('bóng đá')) {
      return {
        'hex': '#22C55E',
        'color': Colors.green,
        'icon': Icons.sports_soccer,
      };
    }

    if (categoryName.contains('quần vợt')) {
      return {
        'hex': '#EAB308',
        'color': Colors.amber.shade700,
        'icon': Icons.sports_tennis,
      };
    }

    if (categoryName.contains('bóng chuyền')) {
      return {
        'hex': '#3B82F6',
        'color': Colors.blue,
        'icon': Icons.sports_volleyball,
      };
    }

    return {'hex': '#9CA3AF', 'color': Colors.grey, 'icon': Icons.location_on};
  }

  Future<List<Map<String, dynamic>>> _searchLocations(String query) async {
    final trimmedQuery = query.trim();

    if (trimmedQuery.isEmpty) return [];

    final url = Uri.parse(
      'https://rsapi.goong.io/Place/AutoComplete'
      '?api_key=$goongApiKey'
      '&input=${Uri.encodeQueryComponent(trimmedQuery)}',
    );

    try {
      final response = await http.get(url);

      if (response.statusCode != 200) return [];

      final data = json.decode(response.body);

      if (data['status'] != 'OK') return [];

      return List<Map<String, dynamic>>.from(data['predictions'] ?? const []);
    } catch (e) {
      debugPrint('Lỗi tìm kiếm vị trí: $e');
      return [];
    }
  }

  Future<void> _handleSelectLocation(String placeId) async {
    final url = Uri.parse(
      'https://rsapi.goong.io/Place/Detail'
      '?api_key=$goongApiKey'
      '&place_id=${Uri.encodeQueryComponent(placeId)}',
    );

    try {
      final response = await http.get(url);

      if (response.statusCode != 200) return;

      final data = json.decode(response.body);

      if (data['status'] != 'OK') return;

      final location = data['result']['geometry']['location'];
      final target = LatLng(
        (location['lat'] as num).toDouble(),
        (location['lng'] as num).toDouble(),
      );

      _mapController?.animateCamera(CameraUpdate.newLatLngZoom(target, 15));
    } catch (e) {
      debugPrint('Lỗi lấy chi tiết vị trí: $e');
    }
  }

  Future<void> _handleMyLocation() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();

    if (!serviceEnabled) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Vui lòng bật định vị!')));
      }
      return;
    }

    var permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return;
    }

    final position = await Geolocator.getCurrentPosition();
    final target = LatLng(position.latitude, position.longitude);

    _mapController?.animateCamera(CameraUpdate.newLatLngZoom(target, 15));

    if (_userLocationCircle != null) {
      await _mapController?.removeCircle(_userLocationCircle!);
    }

    _userLocationCircle = await _mapController?.addCircle(
      CircleOptions(
        geometry: target,
        circleColor: '#1D4ED8',
        circleRadius: 10,
        circleStrokeWidth: 3,
        circleStrokeColor: '#FFFFFF',
      ),
    );
  }

  void _showAreaDetails(RentalAreaResponse area, Map<String, dynamic> theme) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        final street = area.address?.street ?? '';
        final ward = area.address?.ward ?? '';

        final address = [
          street,
          ward,
        ].where((value) => value.trim().isNotEmpty).join(', ');

        final bottomSafeArea = MediaQuery.paddingOf(sheetContext).bottom;

        return Container(
          padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottomSafeArea),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Icon(
                      theme['icon'] as IconData,
                      color: theme['color'] as Color,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      area.rentalAreaName,
                      maxLines: 3,
                      softWrap: true,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: theme['color'] as Color,
                        fontSize: 18,
                        height: 1.3,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 19,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      address.isNotEmpty
                          ? address
                          : 'Chưa có thông tin địa chỉ',
                      maxLines: 3,
                      softWrap: true,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.grey,
                        fontSize: 14,
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme['color'] as Color,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () {
                    Navigator.of(sheetContext).pop();

                    Future.microtask(() {
                      if (!mounted) return;

                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => RentalAreaDetailScreen(
                            rentalAreaId: area.rentalAreaId,
                          ),
                        ),
                      );
                    });
                  },
                  child: const Text(
                    'Xem chi tiết',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
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
    final topSafeArea = MediaQuery.paddingOf(context).top;
    final bottomSafeArea = MediaQuery.paddingOf(context).bottom;

    if (_isPreparingMapStyle) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF9156F1)),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          MapLibreMap(
            styleString: _cleanMapStyle ?? _goongStyleUrl,
            initialCameraPosition: const CameraPosition(
              target: LatLng(10.80155, 106.65421),
              zoom: 13,
            ),
            onMapCreated: _onMapCreated,
            onStyleLoadedCallback: _onStyleLoaded,
            myLocationEnabled: false,
            compassEnabled: false,
          ),
          Positioned(
            top: topSafeArea + 10,
            left: 20,
            right: 20,
            child: Column(
              children: [
                Autocomplete<Map<String, dynamic>>(
                  optionsBuilder: (textEditingValue) {
                    return _searchLocations(textEditingValue.text);
                  },
                  displayStringForOption: (option) {
                    return option['description']?.toString() ?? '';
                  },
                  onSelected: (option) {
                    final placeId = option['place_id']?.toString();

                    if (placeId != null && placeId.isNotEmpty) {
                      _handleSelectLocation(placeId);
                    }
                  },
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
                          child: ValueListenableBuilder<TextEditingValue>(
                            valueListenable: controller,
                            builder: (context, value, _) {
                              return TextField(
                                controller: controller,
                                focusNode: focusNode,
                                textInputAction: TextInputAction.search,
                                onSubmitted: (_) => onFieldSubmitted(),
                                decoration: InputDecoration(
                                  hintText: 'Tìm kiếm khu vực, tên đường...',
                                  prefixIcon: const Icon(
                                    Icons.search,
                                    color: Colors.orange,
                                  ),

                                  // Chỉ hiện nút X khi ô tìm kiếm có chữ.
                                  suffixIcon: value.text.trim().isEmpty
                                      ? null
                                      : IconButton(
                                          tooltip: 'Xóa nội dung',
                                          splashRadius: 20,
                                          onPressed: () {
                                            controller.clear();
                                            focusNode.requestFocus();
                                          },
                                          icon: Icon(
                                            Icons.close_rounded,
                                            color: Colors.grey.shade600,
                                          ),
                                        ),
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                    vertical: 15,
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      },
                ),
                const SizedBox(height: 15),
                _buildFilterBar(),
              ],
            ),
          ),
          Positioned(
            // Hạ cụm nút xuống gần ngang với nút chatbot bên trái.
            bottom: bottomSafeArea + 12,
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

  String _getFilterDisplayTitle(String title) {
    if (title == 'Tất cả') return title;

    // Chỉ bỏ chữ "Sân" ở đầu tên để chip ngắn gọn hơn.
    // Giá trị gốc vẫn được giữ trong _activeFilter để lọc dữ liệu chính xác.
    return title
        .replaceFirst(RegExp(r'^\s*sân\s+', caseSensitive: false), '')
        .trim();
  }

  Widget _buildFilterBar() {
    final filters = <String>[
      'Tất cả',
      ..._categories.map((category) => category.categoryName),
    ];

    return SizedBox(
      height: 46,
      width: double.infinity,
      child: Stack(
        alignment: Alignment.centerRight,
        children: [
          ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.only(right: 48),
            itemCount: filters.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, index) {
              return _buildFilterChip(filters[index]);
            },
          ),

          IgnorePointer(
            child: Container(
              width: 38,
              height: 38,
              margin: const EdgeInsets.only(right: 1),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.94),
                shape: BoxShape.circle,
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 6,
                    offset: Offset(-2, 2),
                  ),
                ],
              ),
              child: const Icon(
                Icons.chevron_right_rounded,
                color: Colors.orange,
                size: 26,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String title) {
    final isActive = _activeFilter == title;
    final displayTitle = _getFilterDisplayTitle(title);

    return ChoiceChip(
      label: Text(
        displayTitle,
        maxLines: 1,
        style: TextStyle(
          fontSize: 14,
          color: isActive ? Colors.orange : Colors.grey.shade700,
          fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
        ),
      ),
      selected: isActive,
      onSelected: (selected) async {
        if (!selected) return;

        setState(() {
          _activeFilter = title;
        });

        await _drawMarkers();
      },
      selectedColor: Colors.white,
      backgroundColor: Colors.white,
      labelPadding: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      visualDensity: VisualDensity.compact,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      side: BorderSide(color: isActive ? Colors.orange : Colors.grey.shade300),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      showCheckmark: false,
    );
  }
}
