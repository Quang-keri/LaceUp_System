import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../models/match.dart';
import '../../../models/match_result.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/match_service.dart';

class MatchLineupDialog extends StatefulWidget {
  final MatchResponse match;
  final MatchResultResponse? matchResultData;
  final VoidCallback onSuccess;

  const MatchLineupDialog({
    Key? key,
    required this.match,
    this.matchResultData,
    required this.onSuccess,
  }) : super(key: key);

  @override
  State<MatchLineupDialog> createState() => _MatchLineupDialogState();
}

class _MatchLineupDialogState extends State<MatchLineupDialog> {
  Map<String, int> teamAssignments = {};
  bool isSaving = false;

  @override
  void initState() {
    super.initState();
    for (var p in widget.match.participants) {
      if (p.teamNumber != null) {
        teamAssignments[p.userId] = p.teamNumber!;
      }
    }
  }

  bool get isEditable =>
      ['OPEN', 'READY', 'PLAYING', 'DISPUTED'].contains(widget.match.status);

  Future<void> _handleSaveTeam() async {
    List<String> team1UserIds = teamAssignments.entries
        .where((e) => e.value == 1)
        .map((e) => e.key)
        .toList();
    List<String> team2UserIds = teamAssignments.entries
        .where((e) => e.value == 2)
        .map((e) => e.key)
        .toList();

    int maxPerTeam = (widget.match.maxPlayers / 2).ceil();
    if (team1UserIds.length > maxPerTeam) return _showMsg("Đội 1 đã đầy!");
    if (team2UserIds.length > maxPerTeam) return _showMsg("Đội 2 đã đầy!");

    setState(() => isSaving = true);
    try {
      await matchService.divideTeams(
        widget.match.matchId,
        team1UserIds,
        team2UserIds,
      );
      _showMsg("Lưu đội hình thành công!");
      widget.onSuccess();
      Navigator.pop(context);
    } catch (e) {
      _showMsg("Lỗi: $e");
    } finally {
      if (mounted) setState(() => isSaving = false);
    }
  }

  void _showMsg(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final myUserId = Provider.of<AuthProvider>(
      context,
      listen: false,
    ).user?['userId']?.toString();

    final team1 = widget.match.participants
        .where((p) => teamAssignments[p.userId] == 1)
        .toList();
    final team2 = widget.match.participants
        .where((p) => teamAssignments[p.userId] == 2)
        .toList();
    final unassigned = widget.match.participants
        .where((p) => !teamAssignments.containsKey(p.userId))
        .toList();

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: MediaQuery.of(context).size.width,
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "Bảng điểm & Đội hình",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            if (isEditable)
              const Padding(
                padding: EdgeInsets.only(top: 4),
                child: Text(
                  "Chạm vào người chơi để loại khỏi đội",
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            const SizedBox(height: 16),

            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildTeamColumn(
                    "ĐỘI 1",
                    team1,
                    Colors.orange,
                    myUserId,
                    true,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildTeamColumn(
                    "ĐỘI 2",
                    team2,
                    Colors.purple,
                    myUserId,
                    false,
                  ),
                ),
              ],
            ),

            if (unassigned.isNotEmpty) ...[
              const Divider(height: 32),
              Text(
                isEditable
                    ? "Chưa chia đội (Chọn để xếp vào đội)"
                    : "Chưa chia đội",
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              if (isEditable)
                Column(
                  children: unassigned
                      .map(
                        (p) => Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 12,
                                backgroundColor: Colors.grey.shade200,
                                child: Text(
                                  p.userName.isNotEmpty
                                      ? p.userName[0].toUpperCase()
                                      : 'U',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey.shade700,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  p.userName,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              InkWell(
                                onTap: () => setState(
                                  () => teamAssignments[p.userId] = 1,
                                ),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.orange.shade50,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    "Vào Đội 1",
                                    style: TextStyle(
                                      color: Colors.orange,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              InkWell(
                                onTap: () => setState(
                                  () => teamAssignments[p.userId] = 2,
                                ),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.purple.shade50,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    "Vào Đội 2",
                                    style: TextStyle(
                                      color: Colors.purple,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                )
              else
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 8,
                  children: unassigned
                      .map(
                        (p) => Chip(
                          backgroundColor: Colors.grey.shade100,
                          label: Text(
                            p.userName,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
            ],

            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    "Đóng",
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
                if (isEditable) ...[
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: isSaving ? null : _handleSaveTeam,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple.shade50,
                      foregroundColor: Colors.purple,
                      elevation: 0,
                    ),
                    child: isSaving
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text(
                            "Lưu đội hình",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTeamColumn(
    String teamName,
    List<dynamic> players,
    Color color,
    String? myUserId,
    bool isLeft,
  ) {
    bool isWinner = false;
    if (widget.matchResultData != null) {
      int teamNum = isLeft ? 1 : 2;
      isWinner = teamNum == widget.matchResultData!.winningTeamNumber;
    }

    return Column(
      children: [
        Row(
          mainAxisAlignment: isLeft
              ? MainAxisAlignment.start
              : MainAxisAlignment.end,
          children: [
            if (!isLeft && widget.matchResultData != null) ...[
              _buildStatusBadge(isWinner),
              const SizedBox(width: 8),
            ],
            Text(
              teamName,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color,
                fontSize: 15,
              ),
            ),
            if (isLeft && widget.matchResultData != null) ...[
              const SizedBox(width: 8),
              _buildStatusBadge(isWinner),
            ],
          ],
        ),
        Divider(color: color.withOpacity(0.3), height: 16, thickness: 1),
        ...players.map(
          (p) => _buildPlayerItem(p, p.userId == myUserId, color, isLeft),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(bool isWinner) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isWinner ? Colors.green : Colors.red,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        isWinner ? "THẮNG" : "THUA",
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildPlayerItem(
    dynamic player,
    bool isMe,
    Color teamColor,
    bool isLeft,
  ) {
    final avatarWidget = CircleAvatar(
      radius: 14,
      backgroundColor: isMe ? teamColor.withOpacity(0.2) : Colors.grey.shade200,
      child: Text(
        player.userName.isNotEmpty ? player.userName[0].toUpperCase() : 'U',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: isMe ? teamColor : Colors.grey.shade700,
        ),
      ),
    );

    final infoWidget = Expanded(
      child: Column(
        crossAxisAlignment: isLeft
            ? CrossAxisAlignment.start
            : CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: isLeft
                ? MainAxisAlignment.start
                : MainAxisAlignment.end,
            children: [
              if (!isLeft && isMe) _buildMeBadge(teamColor),
              Flexible(
                child: Text(
                  player.userName,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (isLeft && isMe) _buildMeBadge(teamColor),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            "Rank: 3025",
            style: TextStyle(fontSize: 9, color: Colors.grey.shade500),
          ),
        ],
      ),
    );

    Widget content = Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      decoration: BoxDecoration(
        color: isMe ? teamColor.withOpacity(0.05) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isMe ? teamColor.withOpacity(0.3) : Colors.grey.shade200,
        ),
      ),
      child: Row(
        children: isLeft
            ? [avatarWidget, const SizedBox(width: 8), infoWidget]
            : [infoWidget, const SizedBox(width: 8), avatarWidget],
      ),
    );

    if (isEditable) {
      return InkWell(
        onTap: () => setState(() => teamAssignments.remove(player.userId)),
        borderRadius: BorderRadius.circular(8),
        child: Stack(
          children: [
            content,
            Positioned(
              top: 4,
              right: isLeft ? 4 : null,
              left: isLeft ? null : 4,
              child: const Icon(Icons.close, size: 12, color: Colors.redAccent),
            ),
          ],
        ),
      );
    }

    return content;
  }

  Widget _buildMeBadge(Color color) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: const Text(
        "BẠN",
        style: TextStyle(
          color: Colors.white,
          fontSize: 8,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
