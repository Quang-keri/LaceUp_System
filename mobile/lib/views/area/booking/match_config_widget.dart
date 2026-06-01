import 'package:flutter/material.dart';

class MatchConfigData {
  final String matchType;
  final int maxPlayers;
  final int minPlayersToStart;
  final String note;

  MatchConfigData({
    required this.matchType,
    required this.maxPlayers,
    required this.minPlayersToStart,
    required this.note,
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

  final Color primaryColor = const Color(0xFF9156F1);
  final Color disabledColor = Colors.grey.shade300;

  int _minAllowed = 2;
  int _maxAllowed = 22;
  int _maxPlayers = 10;
  int _minPlayersToStart = 5;

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

    if (cat.contains('bóng đá') || cat.contains('đá banh')) {
      _minAllowed = 14;
      _maxAllowed = 22;
      _maxPlayers = 14;
    } else if (cat.contains('cầu lông') || cat.contains('pickleball')) {
      _minAllowed = 2;
      _maxAllowed = 4;
      _maxPlayers = 4;
    } else {
      _minAllowed = 2;
      _maxAllowed = 22;
      _maxPlayers = 10;
    }

    _minPlayersToStart = _maxPlayers ~/ 2;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _notifyChanges();
    });
  }

  void _notifyChanges() {
    widget.onChanged(MatchConfigData(
      matchType: _matchType,
      maxPlayers: _maxPlayers,
      minPlayersToStart: _minPlayersToStart,
      note: _noteController.text,
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
        color: primaryColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: primaryColor.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Cấu hình trận đấu (Ghép kèo)',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 12),

          const Text('Thể thức thi đấu',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: _matchType,
            decoration: InputDecoration(
              contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8)),
              fillColor: Colors.white,
              filled: true,
            ),
            items: const [
              DropdownMenuItem(
                  value: 'NORMAL',
                  child: Text('Giao lưu - Chơi vui vẻ',
                      style: TextStyle(fontSize: 14))),
              DropdownMenuItem(
                  value: 'BET',
                  child: Text('Chia Kèo - Đội thua chịu phạt',
                      style: TextStyle(
                          fontSize: 14, color: Color(0xFFEA580C)))),
              DropdownMenuItem(
                  value: 'RANKED',
                  child: Text('Đánh Rank - Tích lũy điểm',
                      style: TextStyle(
                          fontSize: 14, color: Color(0xFF9156F1)))),
            ],
            onChanged: (val) {
              if (val != null) {
                setState(() => _matchType = val);
                _notifyChanges();
              }
            },
          ),
          const SizedBox(height: 16),

          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                flex: 5,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Tối đa (người)',
                        style: TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 6),
                    Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade400),
                      ),
                      child: Row(
                        children: [
                          InkWell(
                            onTap: _maxPlayers > _minAllowed ? _decrement : null,
                            child: Container(
                              width: 42,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: _maxPlayers > _minAllowed
                                    ? primaryColor.withOpacity(0.1)
                                    : disabledColor.withOpacity(0.3),
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(7),
                                  bottomLeft: Radius.circular(7),
                                ),
                              ),
                              child: Icon(Icons.remove,
                                  color: _maxPlayers > _minAllowed
                                      ? primaryColor
                                      : Colors.grey,
                                  size: 20),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              '$_maxPlayers',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                          ),
                          InkWell(
                            onTap: _maxPlayers < _maxAllowed ? _increment : null,
                            child: Container(
                              width: 42,
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
                              child: Icon(Icons.add,
                                  color: _maxPlayers < _maxAllowed
                                      ? primaryColor
                                      : Colors.grey,
                                  size: 20),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 4,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Tối thiểu',
                        style: TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 13)),
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
                            color: Colors.black87,
                            fontWeight: FontWeight.bold,
                            fontSize: 14),
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