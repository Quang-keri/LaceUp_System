import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/category.dart';
import '../../models/match.dart';
import '../../models/rental_area.dart';
import '../../providers/auth_provider.dart';
import '../../services/category_service.dart';
import '../../services/location_service.dart';
import '../../services/match_service.dart';
import '../../services/rental_service.dart';
import 'match_card.dart';
import 'join_match_dialog.dart';
import 'match_filter.dart';

class MatchPage extends StatefulWidget {
  const MatchPage({super.key});

  @override
  State<MatchPage> createState() => _MatchPageState();
}

class _MatchPageState extends State<MatchPage> {
  final TextEditingController _roomCodeController = TextEditingController();

  bool _isLoading = false;
  List<MatchResponse> _matches = [];

  List<RentalAreaResponse> _rentalAreas = [];
  Map<String, Map<String, dynamic>> _groupedMatches = {};

  int _currentPage = 1;
  final int _pageSize = 12;

  String _sortOrder = 'NEWEST';
  String _selectedCategory = '';
  String _typeFilter = 'ALL';
  String _selectedLocation = '';
  String _selectedWard = '';

  List<ProvinceResponse> _provinces = [];
  List<WardResponse> _wards = [];

  List<CategoryResponse> _categories = [];
  bool _isFetchingCategories = false;

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
    _fetchRentalAreas();
  }

  Future<void> _fetchInitialData() async {
    _fetchMatches();
    _fetchCategories();

    try {
      final provData = await locationService.getProvinces();
      if (mounted) setState(() => _provinces = provData);
    } catch (e) {
      debugPrint('Lỗi tải tỉnh thành: $e');
    }
  }

  Future<void> _fetchCategories() async {
    setState(() => _isFetchingCategories = true);
    try {
      final res = await categoryService.getAllCategories(size: 50);
      if (mounted) {
        setState(() => _categories = res.data);
      }
    } catch (e) {
      debugPrint("Lỗi tải danh mục: $e");
    } finally {
      if (mounted) setState(() => _isFetchingCategories = false);
    }
  }

  Future<void> _fetchRentalAreas() async {
    try {
      final res = await rentalService.getAllRentalAreas(size: 100);

      List<dynamic> rawData = [];
      if (res is Map<String, dynamic> && res.containsKey('data')) {
        rawData = res['data'];
      } else if (res is List) {
        rawData = res;
      }

      final List<RentalAreaResponse> areas = rawData
          .map(
            (json) => RentalAreaResponse.fromJson(json as Map<String, dynamic>),
          )
          .toList();

      if (mounted) {
        setState(() {
          _rentalAreas = areas;
          _groupMatchesByArea();
        });
      }
    } catch (e) {
      debugPrint('Lỗi tải thông tin khu vực: $e');
    }
  }

  Future<void> _fetchWards(int provinceCode) async {
    try {
      final wardData = await locationService.getWardsByProvince(provinceCode);
      if (mounted) setState(() => _wards = wardData);
    } catch (e) {
      debugPrint('Lỗi tải phường xã: $e');
    }
  }

  Future<void> _fetchMatches() async {
    setState(() => _isLoading = true);
    try {
      final response = await matchService.getOpenMatches(
        page: _currentPage,
        size: _pageSize,
        category: _selectedCategory.isEmpty ? null : _selectedCategory,
        matchType: _typeFilter == 'ALL' ? null : _typeFilter,
        city: _selectedLocation.isEmpty ? null : _selectedLocation,
        ward: _selectedWard.isEmpty ? null : _selectedWard,
      );

      List<MatchResponse> fetchedMatches = response.data;

      if (_sortOrder == 'PRICE_ASC') {
        fetchedMatches.sort((a, b) => a.courtPrice.compareTo(b.courtPrice));
      } else if (_sortOrder == 'PRICE_DESC') {
        fetchedMatches.sort((a, b) => b.courtPrice.compareTo(a.courtPrice));
      } else {
        fetchedMatches.sort(
          (a, b) => DateTime.parse(
            a.startTime,
          ).compareTo(DateTime.parse(b.startTime)),
        );
      }

      setState(() {
        _matches = fetchedMatches;
        _groupMatchesByArea();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi tải dữ liệu: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _groupMatchesByArea() {
    Map<String, Map<String, dynamic>> groups = {};

    for (var match in _matches) {
      RentalAreaResponse? matchedArea;
      for (var area in _rentalAreas) {
        if (area.courts != null &&
            area.courts!.any((court) => court.courtName == match.courtName)) {
          matchedArea = area;
          break;
        }
      }

      final areaId = matchedArea?.rentalAreaId ?? "unknown_area";

      if (!groups.containsKey(areaId)) {
        groups[areaId] = {
          'areaName':
              matchedArea?.rentalAreaName ?? "Khu vực khác (Chưa xác định)",
          'address': matchedArea?.address != null
              ? '${matchedArea!.address!.street}, ${matchedArea.address!.ward}, ${matchedArea.cityName}'
              : "Chưa cập nhật địa chỉ",
          'firstLetter': matchedArea?.rentalAreaName.isNotEmpty == true
              ? matchedArea!.rentalAreaName[0].toUpperCase()
              : "K",
          'matches': <MatchResponse>[],
        };
      }

      (groups[areaId]!['matches'] as List<MatchResponse>).add(match);
    }

    setState(() {
      _groupedMatches = groups;
    });
  }

  Future<void> _handleJoinByRoomCode() async {
    final code = _roomCodeController.text.trim();
    if (code.isEmpty) return;

    try {
      await matchService.joinMatchByCode(code);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Vào phòng thành công!')));
        _roomCodeController.clear();
        _fetchMatches();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Mã không hợp lệ!')));
      }
    }
  }

  void _openJoinModal(
    MatchResponse match,
    String currentUserId,
    String currentUserName,
  ) {
    showDialog(
      context: context,
      builder: (context) => JoinMatchDialog(
        match: match,
        currentUserId: currentUserId,
        currentUserName: currentUserName,
        onSuccess: _fetchMatches,
      ),
    );
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            top: MediaQuery.of(context).padding.top + 40,
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: StatefulBuilder(
            builder: (BuildContext context, StateSetter setModalState) {
              return MatchFilter(
                sortOrder: _sortOrder,
                setSortOrder: (val) {
                  setModalState(() => _sortOrder = val);
                  setState(() => _sortOrder = val);
                  _fetchMatches();
                },
                selectedCategory: _selectedCategory,
                setSelectedCategory: (val) {
                  setModalState(() => _selectedCategory = val);
                  setState(() => _selectedCategory = val);
                  _fetchMatches();
                },
                typeFilter: _typeFilter,
                setTypeFilter: (val) {
                  setModalState(() => _typeFilter = val);
                  setState(() => _typeFilter = val);
                  _fetchMatches();
                },
                selectedLocation: _selectedLocation,
                setSelectedLocation: (val) {
                  setModalState(() => _selectedLocation = val);
                  setState(() => _selectedLocation = val);
                  _fetchMatches();
                },
                selectedWard: _selectedWard,
                setSelectedWard: (val) {
                  setModalState(() => _selectedWard = val);
                  setState(() => _selectedWard = val);
                  _fetchMatches();
                },
                provinces: _provinces,
                wards: _wards,
                setWards: (val) {
                  setModalState(() => _wards = val.cast<WardResponse>());
                  setState(() => _wards = val.cast<WardResponse>());
                },
                categories: _categories,
                isFetchingCategories: _isFetchingCategories,
                onLocationChanged: (name, provObj) {
                  if (provObj != null) {
                    _fetchWards(provObj.code).then((_) {
                      setModalState(() {});
                    });
                  }
                },
                resetFilters: () {
                  setModalState(() {
                    _sortOrder = 'NEWEST';
                    _selectedCategory = '';
                    _typeFilter = 'ALL';
                    _selectedLocation = '';
                    _selectedWard = '';
                    _wards = [];
                  });
                  setState(() {
                    _sortOrder = 'NEWEST';
                    _selectedCategory = '';
                    _typeFilter = 'ALL';
                    _selectedLocation = '';
                    _selectedWard = '';
                    _wards = [];
                  });
                  _fetchMatches();
                },
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildGroupedMatches(String currentUserId, String currentUserName) {
    if (_groupedMatches.isEmpty) return const SizedBox();

    return ListView.builder(
      itemCount: _groupedMatches.length,
      itemBuilder: (context, index) {
        String key = _groupedMatches.keys.elementAt(index);
        var group = _groupedMatches[key]!;
        List<MatchResponse> areaMatches = group['matches'];

        return Container(
          margin: const EdgeInsets.only(bottom: 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: Colors.grey.shade300,
                      child: Text(
                        group['firstLetter'],
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.black54,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            group['areaName'],
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.location_on,
                                size: 14,
                                color: Colors.green,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  group['address'],
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),

              Container(
                color: Colors.grey.shade50,
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: areaMatches.map((match) {
                    return MatchCard(
                      match: match,
                      currentUserId: currentUserId,
                      onOpenJoinModal: () =>
                          _openJoinModal(match, currentUserId, currentUserName),
                      onJoinSuccess: _fetchMatches,
                    );
                  }).toList(),
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
    final authProvider = Provider.of<AuthProvider>(context);
    final currentUserId = authProvider.user?['userId']?.toString() ?? '';
    final currentUserName = authProvider.userName ?? '';

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Trận Đấu Vãng Lai',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.black87,
                fontSize: 22,
              ),
            ),
            Text(
              'Tìm đồng đội giao lưu hoặc tham gia kèo',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          children: [
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _roomCodeController,
                    decoration: InputDecoration(
                      hintText: 'Nhập mã phòng...',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.search),
                        onPressed: _handleJoinByRoomCode,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _showFilterBottomSheet,
                  icon: const Icon(Icons.filter_alt, color: Color(0xFF9156F1)),
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFF9156F1).withOpacity(0.1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.flash_on),
                  label: const Text('Ghép Trận'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF9156F1),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      vertical: 14,
                      horizontal: 16,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFF9156F1),
                      ),
                    )
                  : _matches.isEmpty
                  ? const Center(
                      child: Text(
                        'Không tìm thấy trận đấu nào!',
                        style: TextStyle(color: Colors.grey),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _fetchMatches,
                      child: _buildGroupedMatches(
                        currentUserId,
                        currentUserName,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
