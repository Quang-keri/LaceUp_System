import 'package:flutter/material.dart';

class MatchConfigData {
  final String matchType;
  final int maxPlayers;
  final int minPlayersToStart;
  final String note;
  final int playerCount;

  MatchConfigData({
    required this.matchType,
    required this.maxPlayers,
    required this.minPlayersToStart,
    required this.note,
    required this.playerCount,
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
  String _matchType = 'NORMAL';
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

    widget.onChanged(MatchConfigData(
      matchType: _matchType,
      maxPlayers: _maxPlayers,
      minPlayersToStart: _minPlayersToStart,
      note: _noteController.text,
      playerCount: _playerCount,
    ));
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F5FF), // Màu nền tím rất nhạt
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primaryColor.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Cấu hình trận đấu',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
          ),
          const SizedBox(height: 16),

          // --- HÀNG 1: Thể thức thi đấu & Số người có sẵn ---
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // 1. Thể thức thi đấu
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Flexible(
                          child: Text('Thể thức thi đấu',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
                        ),
                        const SizedBox(width: 4),
                        Tooltip(
                          message: 'Luật chơi riêng biệt cho trận đấu này',
                          triggerMode: TooltipTriggerMode.tap,
                          child: Icon(Icons.info_outline, size: 14, color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 44, // Đồng bộ chiều cao với ô bên cạnh
                      child: DropdownButtonFormField<String>(
                        isExpanded: true,
                        value: _matchType,
                        icon: const Icon(Icons.arrow_drop_down, size: 20),
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey.shade300)),
                          enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey.shade300)),
                          fillColor: Colors.white,
                          filled: true,
                        ),
                        items: const [
                          DropdownMenuItem(
                              value: 'NORMAL',
                              child: Text('Giao lưu', style: TextStyle(fontSize: 14))),
                          // DropdownMenuItem(
                          //     value: 'BET',
                          //     child: Text('Chia Kèo',
                          //         style: TextStyle(fontSize: 14, color: Color(0xFFEA580C)))),
                          DropdownMenuItem(
                              value: 'RANKED',
                              child: Text('Đánh Rank',
                                  style: TextStyle(fontSize: 14, color: Color(0xFF9156F1)))),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _matchType = val);
                            _notifyChanges();
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),

              // 2. Số người có sẵn
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Flexible(
                          child: Text('Số người có sẵn',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
                        ),
                        const SizedBox(width: 4),
                        Tooltip(
                          message: 'Bao gồm bạn và bạn bè đi cùng (Tối đa $_minPlayersToStart)',
                          triggerMode: TooltipTriggerMode.tap,
                          child: Icon(Icons.info_outline, size: 14, color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 44,
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
                              width: 38,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: _playerCount > 1 ? Colors.grey.shade100 : disabledColor.withOpacity(0.3),
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(7),
                                  bottomLeft: Radius.circular(7),
                                ),
                              ),
                              child: Icon(Icons.remove,
                                  color: _playerCount > 1 ? Colors.grey.shade600 : Colors.grey.shade400,
                                  size: 18),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              '$_playerCount',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                          ),
                          InkWell(
                            onTap: _playerCount < _minPlayersToStart ? _incrementPlayer : null,
                            child: Container(
                              width: 38,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: _playerCount < _minPlayersToStart ? secondaryColor.withOpacity(0.1) : disabledColor.withOpacity(0.3),
                                borderRadius: const BorderRadius.only(
                                  topRight: Radius.circular(7),
                                  bottomRight: Radius.circular(7),
                                ),
                              ),
                              child: Icon(Icons.add,
                                  color: _playerCount < _minPlayersToStart ? secondaryColor : Colors.grey.shade400,
                                  size: 18),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // --- HÀNG 2: Tổng số người & Số người / Team ---
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // 3. Tổng số người (Tối đa)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Flexible(
                          child: Text('Tổng số người',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
                        ),
                        const SizedBox(width: 4),
                        Tooltip(
                          message: 'Tổng số người tham gia tối đa của cả trận đấu',
                          triggerMode: TooltipTriggerMode.tap,
                          child: Icon(Icons.info_outline, size: 14, color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Row(
                        children: [
                          InkWell(
                            onTap: _maxPlayers > _minAllowed ? _decrement : null,
                            child: Container(
                              width: 38,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: _maxPlayers > _minAllowed ? Colors.grey.shade100 : disabledColor.withOpacity(0.3),
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(7),
                                  bottomLeft: Radius.circular(7),
                                ),
                              ),
                              child: Icon(Icons.remove,
                                  color: _maxPlayers > _minAllowed ? Colors.grey.shade600 : Colors.grey.shade400,
                                  size: 18),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              '$_maxPlayers',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                          ),
                          InkWell(
                            onTap: _maxPlayers < _maxAllowed ? _increment : null,
                            child: Container(
                              width: 38,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: _maxPlayers < _maxAllowed ? primaryColor.withOpacity(0.1) : disabledColor.withOpacity(0.3),
                                borderRadius: const BorderRadius.only(
                                  topRight: Radius.circular(7),
                                  bottomRight: Radius.circular(7),
                                ),
                              ),
                              child: Icon(Icons.add,
                                  color: _maxPlayers < _maxAllowed ? primaryColor : Colors.grey.shade400,
                                  size: 18),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),

              // 4. Tối thiểu (Số slot/Team)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Flexible(
                          child: Text('Số người / Team',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
                        ),
                        const SizedBox(width: 4),
                        Tooltip(
                          message: 'Số lượng thành viên tối đa của 1 đội',
                          triggerMode: TooltipTriggerMode.tap,
                          child: Icon(Icons.info_outline, size: 14, color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 44,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$_minPlayersToStart vs $_minPlayersToStart',
                        style: const TextStyle(
                            color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 14),
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