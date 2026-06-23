import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../models/match.dart';
import '../../../models/user.dart';
import '../../../services/match_service.dart';

class SubmitResultDialog extends StatefulWidget {
  final MatchResponse match;
  final VoidCallback onSuccess;

  const SubmitResultDialog({
    super.key,
    required this.match,
    required this.onSuccess,
  });

  @override
  State<SubmitResultDialog> createState() => _SubmitResultDialogState();
}

class _SubmitResultDialogState extends State<SubmitResultDialog> {
  static const Color _orange = Color(0xFFFF9800);
  static const Color _purple = Color(0xFF9156F1);

  int? winningTeam;
  final Set<String> absentUsers = {};
  bool isLoading = false;

  List<UserResponse> get _activePlayers =>
      widget.match.participants.where((p) => p.isCancelled != true).toList();

  List<UserResponse> get _team1Players =>
      _activePlayers.where((p) => p.teamNumber == 1).toList();

  List<UserResponse> get _team2Players =>
      _activePlayers.where((p) => p.teamNumber == 2).toList();

  Future<void> _handleSubmit() async {
    if (winningTeam == null) {
      _showMessage('Vui lòng chọn đội chiến thắng', isError: true);
      return;
    }

    if (isLoading) return;

    setState(() => isLoading = true);

    try {
      await matchService.submitResult(
        matchId: widget.match.matchId,
        winningTeamNumber: winningTeam!,
        absentUserIds: absentUsers.toList(),
      );

      if (!mounted) return;

      final messenger = ScaffoldMessenger.of(context);
      messenger.hideCurrentSnackBar();
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Đã gửi kết quả, đang chờ đối thủ xác nhận'),
          backgroundColor: Color(0xFF16A34A),
          behavior: SnackBarBehavior.floating,
        ),
      );

      Navigator.pop(context);
      widget.onSuccess();
    } catch (e) {
      if (!mounted) return;
      _showMessage(
        _getErrorMessage(e, fallback: 'Không thể gửi kết quả trận đấu'),
        isError: true,
      );
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
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

      if (error.message != null && error.message!.trim().isNotEmpty) {
        return error.message!.trim();
      }
    }

    final text = error.toString().replaceFirst('Exception: ', '').trim();
    return text.isNotEmpty ? text : fallback;
  }

  void _showMessage(String message, {bool isError = false}) {
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : const Color(0xFF16A34A),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  String _initialOf(String name) {
    final trimmed = name.trim();
    return trimmed.isEmpty ? '?' : trimmed.substring(0, 1).toUpperCase();
  }

  Widget _buildPlayerName(UserResponse player, Color teamColor) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: 13,
            backgroundColor: teamColor.withOpacity(0.12),
            child: Text(
              _initialOf(player.userName),
              style: TextStyle(
                color: teamColor,
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              player.userName.isEmpty ? 'Người chơi' : player.userName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF374151),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectableTeamCard({
    required int teamNumber,
    required List<UserResponse> players,
  }) {
    final bool selected = winningTeam == teamNumber;
    final color = teamNumber == 1 ? _orange : _purple;
    final selectedBackground = teamNumber == 1
        ? const Color(0xFFFFF7ED)
        : const Color(0xFFF5F3FF);

    return InkWell(
      onTap: isLoading ? null : () => setState(() => winningTeam = teamNumber),
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? selectedBackground : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? color : const Color(0xFFE5E7EB),
            width: selected ? 1.8 : 1,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: color.withOpacity(0.10),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: Text(
                    '$teamNumber',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Đội $teamNumber',
                    style: TextStyle(
                      color: color,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 180),
                  child: selected
                      ? Icon(
                          Icons.check_circle_rounded,
                          key: ValueKey(teamNumber),
                          color: color,
                          size: 24,
                        )
                      : Icon(
                          Icons.radio_button_unchecked_rounded,
                          key: ValueKey(-teamNumber),
                          color: Colors.grey.shade400,
                          size: 24,
                        ),
                ),
              ],
            ),
            if (players.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 10),
                child: Text(
                  'Chưa có thành viên',
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              )
            else
              ...players.map((player) => _buildPlayerName(player, color)),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceTile(UserResponse player) {
    final isAbsent = absentUsers.contains(player.userId);
    final teamColor = player.teamNumber == 1 ? _orange : _purple;
    final teamText = player.teamNumber == null ? '?' : '${player.teamNumber}';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isAbsent ? const Color(0xFFFEF2F2) : Colors.white,
        borderRadius: BorderRadius.circular(11),
        border: Border.all(
          color: isAbsent ? const Color(0xFFFCA5A5) : const Color(0xFFE5E7EB),
        ),
      ),
      child: CheckboxListTile(
        value: isAbsent,
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 10),
        controlAffinity: ListTileControlAffinity.leading,
        activeColor: const Color(0xFFEF4444),
        title: Row(
          children: [
            Expanded(
              child: Text(
                player.userName.isEmpty ? 'Người chơi' : player.userName,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: teamColor.withOpacity(0.10),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Đội $teamText',
                style: TextStyle(
                  color: teamColor,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        subtitle: isAbsent
            ? const Text(
                'Đánh dấu vắng mặt',
                style: TextStyle(color: Color(0xFFDC2626), fontSize: 11),
              )
            : null,
        onChanged: isLoading
            ? null
            : (value) {
                setState(() {
                  if (value == true) {
                    absentUsers.add(player.userId);
                  } else {
                    absentUsers.remove(player.userId);
                  }
                });
              },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 540, maxHeight: 760),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: _orange.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: const Icon(
                      Icons.emoji_events_rounded,
                      color: _orange,
                      size: 27,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Chốt kết quả trận đấu',
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF111827),
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'Chọn đội thắng và kiểm tra người vắng mặt.',
                          style: TextStyle(
                            color: Color(0xFF6B7280),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: isLoading ? null : () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              const Text(
                '1. Chọn đội chiến thắng',
                style: TextStyle(
                  color: Color(0xFF374151),
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              _buildSelectableTeamCard(teamNumber: 1, players: _team1Players),
              const SizedBox(height: 10),
              _buildSelectableTeamCard(teamNumber: 2, players: _team2Players),

              const SizedBox(height: 22),
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      '2. Điểm danh người vắng mặt',
                      style: TextStyle(
                        color: Color(0xFF374151),
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  if (absentUsers.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${absentUsers.length} người vắng',
                        style: const TextStyle(
                          color: Color(0xFFDC2626),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Người bị đánh dấu vắng sẽ bị trừ điểm uy tín và Rank.',
                style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11),
              ),
              const SizedBox(height: 10),

              if (_activePlayers.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(11),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: const Text(
                    'Không có người chơi để điểm danh.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              else
                ..._activePlayers.map(_buildAttendanceTile),

              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: TextButton(
                        onPressed: isLoading
                            ? null
                            : () => Navigator.pop(context),
                        child: const Text(
                          'Hủy',
                          style: TextStyle(
                            color: Colors.grey,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: SizedBox(
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: isLoading ? null : _handleSubmit,
                        icon: isLoading
                            ? const SizedBox.shrink()
                            : const Icon(Icons.send_rounded, size: 18),
                        label: isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Gửi kết quả',
                                style: TextStyle(fontWeight: FontWeight.w800),
                              ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _orange,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(11),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
