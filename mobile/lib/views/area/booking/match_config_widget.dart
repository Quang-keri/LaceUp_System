import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';

class MatchConfigData {
  final String matchType;
  final int maxPlayers;
  final int minPlayersToStart;
  final String note;
  final int playerCount;
  final int? minRank;
  final int? maxRank;

  MatchConfigData({
    required this.matchType,
    required this.maxPlayers,
    required this.minPlayersToStart,
    required this.note,
    required this.playerCount,
    this.minRank,
    this.maxRank,
  });
}

class MatchConfigWidget extends StatefulWidget {
  final String categoryName;
  final Function(MatchConfigData) onChanged;

  const MatchConfigWidget({
    super.key,
    required this.categoryName,
    required this.onChanged,
  });

  @override
  State<MatchConfigWidget> createState() => _MatchConfigWidgetState();
}

class _MatchConfigWidgetState extends State<MatchConfigWidget> {
  // Ép cứng mặc định là Đánh Rank
  final String _matchType = 'RANKED';
  final TextEditingController _noteController = TextEditingController();

  final Color primaryColor = const Color(0xFF9156F1); // Tím LaceUp
  final Color secondaryColor = const Color(0xFFEA580C); // Cam LaceUp
  final Color disabledColor = Colors.grey.shade300;

  int _minAllowed = 2;
  int _maxAllowed = 22;
  int _maxPlayers = 10;
  int _minPlayersToStart = 5;
  int _playerCount = 1;

  @override
  void initState() {
    super.initState();
    _setupLimits();
  }

  @override
  void didUpdateWidget(MatchConfigWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.categoryName != widget.categoryName) {
      _setupLimits();
    }
  }

  void _setupLimits() {
    final cat = widget.categoryName.toLowerCase();

    if (cat.contains('bóng đá') ||
        cat.contains('bong da') ||
        cat.contains('đá banh') ||
        cat.contains('da banh')) {
      _minAllowed = 10;
      _maxAllowed = 22;
      _maxPlayers = 10;
    } else if (cat.contains('cầu lông') ||
        cat.contains('cau long') ||
        cat.contains('pickleball')) {
      _minAllowed = 4;
      _maxAllowed = 8;
      _maxPlayers = 4;
    } else {
      _minAllowed = 2;
      _maxAllowed = 22;
      _maxPlayers = 10;
    }

    _minPlayersToStart = _maxPlayers ~/ 2;
    if (_playerCount > _minPlayersToStart) {
      _playerCount = _minPlayersToStart;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _notifyChanges();
    });
  }

  void _notifyChanges() {
    if (_playerCount > _minPlayersToStart) {
      _playerCount = _minPlayersToStart;
    }

    int? minRank;
    int? maxRank;

    if (_matchType == 'RANKED') {
      int currentRank = 0;

      try {
        final authProvider = context.read<AuthProvider>();
        final user = authProvider.user;

        if (user != null) {
          List<dynamic> ranks = [];
          if (user is Map) {
            ranks = user['categoryRanks'] ?? [];
          } else {
            ranks = (user as dynamic).categoryRanks ?? [];
          }

          for (var r in ranks) {
            String cName = '';
            int cRank = 0;

            if (r is Map) {
              cName = r['categoryName']?.toString() ?? '';
              cRank = int.tryParse(r['rankPoint']?.toString() ?? '0') ?? 0;
            } else {
              cName = (r as dynamic).categoryName?.toString() ?? '';
              cRank = ((r as dynamic).rankPoint as num?)?.toInt() ?? 0;
            }

            if (cName.trim().toLowerCase() ==
                widget.categoryName.trim().toLowerCase()) {
              currentRank = cRank;
              break;
            }
          }
        }
      } catch (e) {
        debugPrint('Lỗi lấy rank người dùng: $e');
      }

      minRank = (currentRank - 500 < 0) ? 0 : (currentRank - 500);
      maxRank = currentRank + 500;
    }

    widget.onChanged(
      MatchConfigData(
        matchType: _matchType,
        maxPlayers: _maxPlayers,
        minPlayersToStart: _minPlayersToStart,
        note: _noteController.text,
        playerCount: _playerCount,
        minRank: minRank,
        maxRank: maxRank,
      ),
    );
  }

  void _increment() {
    if (_maxPlayers + 2 <= _maxAllowed) {
      setState(() {
        _maxPlayers += 2;
        _minPlayersToStart = _maxPlayers ~/ 2;
      });
      _notifyChanges();
    }
  }

  void _decrement() {
    if (_maxPlayers - 2 >= _minAllowed) {
      setState(() {
        _maxPlayers -= 2;
        _minPlayersToStart = _maxPlayers ~/ 2;
        if (_playerCount > _minPlayersToStart) {
          _playerCount = _minPlayersToStart;
        }
      });
      _notifyChanges();
    }
  }

  void _incrementPlayer() {
    if (_playerCount < _minPlayersToStart) {
      setState(() {
        _playerCount++;
      });
      _notifyChanges();
    }
  }

  void _decrementPlayer() {
    if (_playerCount > 1) {
      setState(() {
        _playerCount--;
      });
      _notifyChanges();
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F5FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primaryColor.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Cấu hình trận đấu',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),

          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                flex: 10,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Flexible(
                          child: Text(
                            'Tổng người',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 11,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 2),
                        Tooltip(
                          message:
                              'Tổng số người tham gia tối đa của cả trận đấu',
                          triggerMode: TooltipTriggerMode.tap,
                          child: Icon(
                            Icons.info_outline,
                            size: 12,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 38, // Thu nhỏ height
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Row(
                        children: [
                          InkWell(
                            onTap: _maxPlayers > _minAllowed
                                ? _decrement
                                : null,
                            child: Container(
                              width: 28, // Thu nhỏ nút
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: _maxPlayers > _minAllowed
                                    ? Colors.grey.shade100
                                    : disabledColor.withOpacity(0.3),
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(7),
                                  bottomLeft: Radius.circular(7),
                                ),
                              ),
                              child: Icon(
                                Icons.remove,
                                color: _maxPlayers > _minAllowed
                                    ? Colors.grey.shade600
                                    : Colors.grey.shade400,
                                size: 16,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              '$_maxPlayers',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          InkWell(
                            onTap: _maxPlayers < _maxAllowed
                                ? _increment
                                : null,
                            child: Container(
                              width: 28,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: _maxPlayers < _maxAllowed
                                    ? primaryColor.withOpacity(0.1)
                                    : disabledColor.withOpacity(0.3),
                                borderRadius: const BorderRadius.only(
                                  topRight: Radius.circular(7),
                                  bottomRight: Radius.circular(7),
                                ),
                              ),
                              child: Icon(
                                Icons.add,
                                color: _maxPlayers < _maxAllowed
                                    ? primaryColor
                                    : Colors.grey.shade400,
                                size: 16,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),

              // 2. Số người có sẵn
              Expanded(
                flex: 10,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Flexible(
                          child: Text(
                            'Có sẵn',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 11,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 2),
                        Tooltip(
                          message:
                              'Bao gồm bạn và bạn bè đi cùng (Tối đa $_minPlayersToStart)',
                          triggerMode: TooltipTriggerMode.tap,
                          child: Icon(
                            Icons.info_outline,
                            size: 12,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 38,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Row(
                        children: [
                          InkWell(
                            onTap: _playerCount > 1 ? _decrementPlayer : null,
                            child: Container(
                              width: 28,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: _playerCount > 1
                                    ? Colors.grey.shade100
                                    : disabledColor.withOpacity(0.3),
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(7),
                                  bottomLeft: Radius.circular(7),
                                ),
                              ),
                              child: Icon(
                                Icons.remove,
                                color: _playerCount > 1
                                    ? Colors.grey.shade600
                                    : Colors.grey.shade400,
                                size: 16,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              '$_playerCount',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          InkWell(
                            onTap: _playerCount < _minPlayersToStart
                                ? _incrementPlayer
                                : null,
                            child: Container(
                              width: 28,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: _playerCount < _minPlayersToStart
                                    ? secondaryColor.withOpacity(0.1)
                                    : disabledColor.withOpacity(0.3),
                                borderRadius: const BorderRadius.only(
                                  topRight: Radius.circular(7),
                                  bottomRight: Radius.circular(7),
                                ),
                              ),
                              child: Icon(
                                Icons.add,
                                color: _playerCount < _minPlayersToStart
                                    ? secondaryColor
                                    : Colors.grey.shade400,
                                size: 16,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),

              // 3. Số người / Team
              Expanded(
                flex: 9,
                // Cho ô này bé hơn 1 xíu để nhường diện tích cho 2 ô kia
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Flexible(
                          child: Text(
                            'Ng / Team',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 11,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 2),
                        Tooltip(
                          message: 'Số lượng thành viên tối đa của 1 đội',
                          triggerMode: TooltipTriggerMode.tap,
                          child: Icon(
                            Icons.info_outline,
                            size: 12,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 38,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$_minPlayersToStart v $_minPlayersToStart',
                        style: const TextStyle(
                          color: Colors.black87,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
