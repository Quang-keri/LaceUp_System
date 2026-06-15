import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
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
  String? errorMessage;

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
    if (isSaving) return;

    final team1UserIds = teamAssignments.entries
        .where((e) => e.value == 1)
        .map((e) => e.key)
        .toList();

    final team2UserIds = teamAssignments.entries
        .where((e) => e.value == 2)
        .map((e) => e.key)
        .toList();

    final maxPerTeam = (widget.match.maxPlayers / 2).ceil();

    if (team1UserIds.length > maxPerTeam) {
      _setError('Đội 1 đã đầy!');
      return;
    }

    if (team2UserIds.length > maxPerTeam) {
      _setError('Đội 2 đã đầy!');
      return;
    }

    setState(() {
      isSaving = true;
      errorMessage = null;
    });

    try {
      await matchService.divideTeams(
        widget.match.matchId,
        team1UserIds,
        team2UserIds,
      );

      if (!mounted) return;

      final messenger = ScaffoldMessenger.of(context);

      widget.onSuccess();
      Navigator.pop(context);

      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('Đã cập nhật đội của bạn thành công!'),
            backgroundColor: Color(0xFF16A34A),
            behavior: SnackBarBehavior.floating,
          ),
        );
    } catch (e) {
      if (!mounted) return;
      _setError(_getErrorMessage(e, fallback: 'Không thể lưu đội hình'));
    } finally {
      if (mounted) {
        setState(() => isSaving = false);
      }
    }
  }

  void _setError(String message) {
    if (!mounted) return;

    setState(() {
      errorMessage = message;
    });
  }

  String _getErrorMessage(Object error, {required String fallback}) {
    if (error is DioException) {
      final data = error.response?.data;

      if (data is Map && data['message'] != null) {
        final message = data['message'].toString().trim();
        if (message.isNotEmpty) return message;
      }

      if (data is String && data.trim().isNotEmpty) {
        return data.trim();
      }

      final dioMessage = error.message?.trim();
      if (dioMessage != null && dioMessage.isNotEmpty) {
        return dioMessage;
      }
    }

    final message = error.toString().replaceFirst('Exception: ', '').trim();
    return message.isNotEmpty ? message : fallback;
  }

  Widget _buildErrorBanner() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFCA5A5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.error_outline_rounded,
            color: Color(0xFFDC2626),
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              errorMessage ?? '',
              style: const TextStyle(
                color: Color(0xFFB91C1C),
                fontSize: 12,
                fontWeight: FontWeight.w600,
                height: 1.35,
              ),
            ),
          ),
          InkWell(
            onTap: () => setState(() => errorMessage = null),
            borderRadius: BorderRadius.circular(20),
            child: const Padding(
              padding: EdgeInsets.all(2),
              child: Icon(
                Icons.close_rounded,
                color: Color(0xFFB91C1C),
                size: 17,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final myUserId = Provider.of<AuthProvider>(
      context,
      listen: false,
    ).user?['userId']?.toString();

    final activeParticipants = widget.match.participants
        .where((p) => p.isCancelled != true)
        .toList();

    final bool isParticipant = activeParticipants.any(
      (member) => member.userId == myUserId,
    );

    final myInfo = activeParticipants
        .where((p) => p.userId == myUserId)
        .firstOrNull;
    final bool hasUnpaidFee =
        myInfo != null && (myInfo.amountDue ?? 0) > 0 && myInfo.isPaid != true;

    final team1 = activeParticipants
        .where((p) => teamAssignments[p.userId] == 1)
        .toList();
    final team2 = activeParticipants
        .where((p) => teamAssignments[p.userId] == 2)
        .toList();
    final unassigned = activeParticipants
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

            if (errorMessage != null) _buildErrorBanner(),

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
                    hasUnpaidFee,
                    isParticipant,
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
                    hasUnpaidFee,
                    isParticipant,
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
              const SizedBox(height: 12),

              if (isEditable)
                Column(
                  children: unassigned.map((p) {
                    bool isMe = p.userId == myUserId;
                    bool isPlayerUnpaid =
                        (p.amountDue ?? 0) > 0 && p.isPaid != true;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.only(bottom: 10),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: Colors.grey.shade100),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: isMe
                                ? Colors.purple.shade100
                                : Colors.grey.shade200,
                            child: Text(
                              p.userName.isNotEmpty
                                  ? p.userName[0].toUpperCase()
                                  : 'U',
                              style: TextStyle(
                                fontSize: 14,
                                color: isMe
                                    ? Colors.purple
                                    : Colors.grey.shade700,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        p.userName,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: isMe
                                              ? FontWeight.bold
                                              : FontWeight.w600,
                                          color: isMe
                                              ? Colors.purple
                                              : Colors.black87,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (isMe) _buildMeBadge(Colors.purple),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  "Điểm Rank: ${p.categoryRanks?.isNotEmpty == true ? p.categoryRanks![0].rankPoint : '0'}",
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey.shade500,
                                  ),
                                ),
                                if ((p.amountDue ?? 0) > 0) ...[
                                  const SizedBox(height: 6),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 4,
                                    crossAxisAlignment:
                                        WrapCrossAlignment.center,
                                    children: [
                                      Text(
                                        "Cần góp: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(p.amountDue)}",
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.deepOrange,
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 4,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: p.isPaid == true
                                              ? Colors.purple.shade50
                                              : Colors.grey.shade100,
                                          borderRadius: BorderRadius.circular(
                                            4,
                                          ),
                                        ),
                                        child: Text(
                                          p.isPaid == true
                                              ? "ĐÃ GÓP"
                                              : "CHƯA GÓP",
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.bold,
                                            color: p.isPaid == true
                                                ? Colors.purple
                                                : Colors.grey.shade600,
                                          ),
                                        ),
                                      ),
                                      if ((p.playerCount ?? 1) > 1)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 4,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.orange.shade50,
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                          ),
                                          child: Text(
                                            "+${p.playerCount! - 1} slot",
                                            style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.orange.shade800,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),

                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              if (isEditable &&
                                  isParticipant &&
                                  !isPlayerUnpaid) ...[
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    InkWell(
                                      onTap: () => setState(() {
                                        teamAssignments[p.userId] = 1;
                                        errorMessage = null;
                                      }),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.orange.shade50,
                                          borderRadius: BorderRadius.circular(
                                            6,
                                          ),
                                        ),
                                        child: const Text(
                                          "Đội 1",
                                          style: TextStyle(
                                            color: Colors.orange,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    InkWell(
                                      onTap: () => setState(() {
                                        teamAssignments[p.userId] = 2;
                                        errorMessage = null;
                                      }),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.purple.shade50,
                                          borderRadius: BorderRadius.circular(
                                            6,
                                          ),
                                        ),
                                        child: const Text(
                                          "Đội 2",
                                          style: TextStyle(
                                            color: Colors.purple,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ] else if (isPlayerUnpaid) ...[
                                const Text(
                                  "Chưa thanh toán",
                                  style: TextStyle(
                                    color: Colors.red,
                                    fontSize: 11,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ] else ...[
                                const Text(
                                  "Chưa chọn",
                                  style: TextStyle(
                                    color: Colors.grey,
                                    fontSize: 11,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    );
                  }).toList(),
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
                if (isEditable && !hasUnpaidFee) ...[
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
    bool hasUnpaidFee,
    bool isParticipant,
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
          (p) => _buildPlayerItem(
            p,
            p.userId == myUserId,
            color,
            isLeft,
            hasUnpaidFee,
            isParticipant,
          ),
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
    bool hasUnpaidFee,
    bool isParticipant,
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
            "Rank: ${player.categoryRanks != null && player.categoryRanks.isNotEmpty ? player.categoryRanks[0].rankPoint : '0'}",
            style: TextStyle(fontSize: 9, color: Colors.grey.shade500),
          ),

          if ((player.playerCount ?? 1) > 1) ...[
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                "+${player.playerCount! - 1} slot",
                style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange.shade800,
                ),
              ),
            ),
          ],
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

    bool isPlayerUnpaid = (player.amountDue ?? 0) > 0 && player.isPaid != true;

    if (isEditable && isParticipant && !isPlayerUnpaid) {
      return InkWell(
        onTap: () => setState(() {
          teamAssignments.remove(player.userId);
          errorMessage = null;
        }),
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
