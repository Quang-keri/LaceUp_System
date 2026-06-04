import 'package:flutter/material.dart';
import '../../models/match.dart';
import '../../services/match_service.dart';

class JoinMatchDialog extends StatefulWidget {
  final MatchResponse match;
  final String currentUserName;
  final String currentUserId;
  final VoidCallback onSuccess;

  const JoinMatchDialog({
    super.key,
    required this.match,
    required this.currentUserName,
    required this.currentUserId,
    required this.onSuccess,
  });

  @override
  State<JoinMatchDialog> createState() => _JoinMatchDialogState();
}

class _JoinMatchDialogState extends State<JoinMatchDialog> {
  bool _isLoading = false;
  Map<String, int> _teamAssignments = {};

  @override
  void initState() {
    super.initState();
    for (var p in widget.match.participants) {
      // Giả sử UserResponse có thuộc tính teamNumber.
      // Nếu không có trong model, bạn có thể bổ sung vào UserResponse.
      // Tạm thời set mặc định nếu ko có
      // _teamAssignments[p.userId] = p.teamNumber ?? 0;
    }
  }

  bool get isParticipant => widget.match.participants.any((p) => p.userId == widget.currentUserId);
  bool get isHost => widget.match.host!.userName == widget.currentUserName;

  Future<void> _handleJoin() async {
    setState(() => _isLoading = true);
    try {
      await matchService.joinMatch(widget.match.matchId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tham gia trận thành công!')));
        widget.onSuccess();
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSaveTeams() async {
    final team1 = _teamAssignments.entries.where((e) => e.value == 1).map((e) => e.key).toList();
    final team2 = _teamAssignments.entries.where((e) => e.value == 2).map((e) => e.key).toList();

    setState(() => _isLoading = true);
    try {
      await matchService.divideTeams(widget.match.matchId, team1, team2);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lưu đội hình thành công!')));
        widget.onSuccess();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Widget> _buildFooterActions() {
    List<Widget> actions = [];

    if (isHost && ['OPEN', 'CONFIRMED', 'FULL'].contains(widget.match.status)) {
      actions.add(
        ElevatedButton(
          onPressed: _isLoading ? null : _handleSaveTeams,
          style: ElevatedButton.styleFrom(backgroundColor: Colors.purple),
          child: _isLoading
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Lưu Đội Hình', style: TextStyle(color: Colors.white)),
        ),
      );
    }

    if (widget.match.status == "OPEN" || (widget.match.status == "CONFIRMED" && widget.match.remainingSlots > 0)) {
      if (isParticipant) {
        actions.add(const ElevatedButton(onPressed: null, child: Text('Bạn đã tham gia')));
      } else {
        actions.add(
          ElevatedButton(
            onPressed: _isLoading ? null : _handleJoin,
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
            child: const Text('Tham Gia Ngay', style: TextStyle(color: Colors.white)),
          ),
        );
      }
    } else if (widget.match.status == "WAITING_DEPOSIT") {
      actions.add(const ElevatedButton(onPressed: null, child: Text('Đang chờ chốt cọc')));
    } else if (['FULL', 'CONFIRMED'].contains(widget.match.status)) {
      actions.add(const ElevatedButton(onPressed: null, child: Text('Đã đủ người')));
    }

    actions.add(TextButton(onPressed: () => Navigator.pop(context), child: const Text('Đóng')));

    return actions.reversed.toList();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        padding: const EdgeInsets.all(20),
        constraints: const BoxConstraints(maxHeight: 600, maxWidth: 500),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Chi tiết trận đấu', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.blue.shade100)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.match.title.isNotEmpty ? widget.match.title : 'Giao lưu ${widget.match.categoryName}', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue.shade900)),
                  const SizedBox(height: 8),
                  Row(children: [const Icon(Icons.location_on, size: 16, color: Colors.blue), const SizedBox(width: 8), Expanded(child: Text(widget.match.hasCourt ? widget.match.courtName : 'Tự thỏa thuận'))]),
                ],
              ),
            ),
            const SizedBox(height: 16),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Danh sách tham gia', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(20)),
                  child: Text('${widget.match.currentPlayers} / ${widget.match.maxPlayers}', style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            if (isHost)
              Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.purple.shade50, borderRadius: BorderRadius.circular(8)),
                child: const Row(
                  children: [
                    Icon(Icons.warning_amber_rounded, size: 16, color: Colors.purple),
                    SizedBox(width: 8),
                    Expanded(child: Text('Bạn là Chủ phòng. Hãy chia đội cho người chơi!', style: TextStyle(fontSize: 12, color: Colors.purple))),
                  ],
                ),
              ),
            const SizedBox(height: 12),

            Expanded(
              child: Container(
                decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade200), borderRadius: BorderRadius.circular(12)),
                child: ListView.separated(
                  itemCount: widget.match.participants.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final player = widget.match.participants[index];
                    return ListTile(
                      leading: CircleAvatar(backgroundColor: Colors.blue, child: Text(player.userName[0].toUpperCase(), style: const TextStyle(color: Colors.white))),
                      title: Row(
                        children: [
                          Text(player.userName, style: const TextStyle(fontWeight: FontWeight.bold)),
                          if (player.userName == widget.match.host!.userName)
                            Container(
                              margin: const EdgeInsets.only(left: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: Colors.blue, borderRadius: BorderRadius.circular(4)),
                              child: const Text('HOST', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                            )
                        ],
                      ),
                      trailing: isHost ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ChoiceChip(
                            label: const Text('1'),
                            selected: _teamAssignments[player.userId] == 1,
                            onSelected: (val) => setState(() => _teamAssignments[player.userId] = 1),
                          ),
                          const SizedBox(width: 4),
                          ChoiceChip(
                            label: const Text('2'),
                            selected: _teamAssignments[player.userId] == 2,
                            onSelected: (val) => setState(() => _teamAssignments[player.userId] = 2),
                          ),
                        ],
                      ) : null,
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.end,
              children: _buildFooterActions(),
            )
          ],
        ),
      ),
    );
  }
}