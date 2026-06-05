import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../models/match.dart';
import '../../../models/match_result.dart';
import '../../../models/user.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/match_result_service.dart';

class ApproveResultDialog extends StatefulWidget {
  final MatchResponse match;
  final VoidCallback onSuccess;

  const ApproveResultDialog({
    super.key,
    required this.match,
    required this.onSuccess,
  });

  @override
  State<ApproveResultDialog> createState() => _ApproveResultDialogState();
}

class _ApproveResultDialogState extends State<ApproveResultDialog> {
  static const Color _orange = Color(0xFFFF9800);
  static const Color _purple = Color(0xFF9156F1);

  bool isLoading = true;
  bool isSubmitting = false;
  MatchResultResponse? pendingResult;

  List<UserResponse> get _team1Players => widget.match.participants
      .where((p) => p.isCancelled != true && p.teamNumber == 1)
      .toList();

  List<UserResponse> get _team2Players => widget.match.participants
      .where((p) => p.isCancelled != true && p.teamNumber == 2)
      .toList();

  @override
  void initState() {
    super.initState();
    _fetchResult();
  }

  Future<void> _fetchResult() async {
    try {
      final results = await matchResultService.getResultsByMatch(
        widget.match.matchId,
      );

      if (!mounted) return;

      setState(() {
        pendingResult = results.isNotEmpty ? results.first : null;
      });
    } catch (e) {
      if (!mounted) return;
      _showMessage(
        _getErrorMessage(e, fallback: 'Không thể tải kết quả trận đấu'),
        isError: true,
      );
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _handleRespond(bool isAccepted) async {
    if (pendingResult == null || isSubmitting) return;

    setState(() => isSubmitting = true);

    try {
      await matchResultService.respondToResult(
        pendingResult!.resultId,
        isAccepted,
      );

      if (!mounted) return;

      final messenger = ScaffoldMessenger.of(context);
      messenger.hideCurrentSnackBar();
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            isAccepted
                ? 'Đã xác nhận kết quả trận đấu'
                : 'Đã từ chối kết quả trận đấu',
          ),
          backgroundColor: isAccepted ? const Color(0xFF16A34A) : Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );

      Navigator.pop(context);
      widget.onSuccess();
    } catch (e) {
      if (!mounted) return;
      _showMessage(
        _getErrorMessage(e, fallback: 'Không thể xử lý kết quả'),
        isError: true,
      );
    } finally {
      if (mounted) {
        setState(() => isSubmitting = false);
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

  Widget _buildPlayerRow(UserResponse player, Color color) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: color.withOpacity(0.12),
            child: Text(
              _initialOf(player.userName),
              style: TextStyle(
                color: color,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              player.userName.isEmpty ? 'Người chơi' : player.userName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
          ),
          if ((player.playerCount ?? 1) > 1)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: color.withOpacity(0.10),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${player.playerCount} người',
                style: TextStyle(
                  color: color,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTeamCard({
    required int teamNumber,
    required List<UserResponse> players,
    required bool isWinner,
  }) {
    final color = teamNumber == 1 ? _orange : _purple;
    final background = teamNumber == 1
        ? const Color(0xFFFFF7ED)
        : const Color(0xFFF5F3FF);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isWinner ? background : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isWinner ? color : const Color(0xFFE5E7EB),
          width: isWinner ? 1.6 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
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
              if (isWinner)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.emoji_events_rounded,
                        size: 13,
                        color: Colors.white,
                      ),
                      SizedBox(width: 4),
                      Text(
                        'Thắng',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
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
            ...players.map((player) => _buildPlayerRow(player, color)),
        ],
      ),
    );
  }

  Widget _buildLoadingDialog() {
    return const Dialog(
      backgroundColor: Colors.white,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 40, vertical: 34),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: _purple),
            SizedBox(width: 16),
            Text(
              'Đang tải kết quả...',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return _buildLoadingDialog();
    }

    final authProvider = context.read<AuthProvider>();
    final myUserId = authProvider.user?['userId']?.toString() ?? '';
    final isSubmitter = pendingResult?.submitterId == myUserId;
    final winningTeam = pendingResult?.winningTeamNumber;

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520, maxHeight: 720),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: IconButton(
                  onPressed: isSubmitting ? null : () => Navigator.pop(context),
                  icon: const Icon(Icons.close_rounded),
                  tooltip: 'Đóng',
                ),
              ),
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: isSubmitter
                      ? _purple.withOpacity(0.12)
                      : _orange.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isSubmitter
                      ? Icons.hourglass_top_rounded
                      : Icons.verified_user_rounded,
                  color: isSubmitter ? _purple : _orange,
                  size: 32,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                isSubmitter ? 'Đã gửi kết quả' : 'Xác nhận kết quả',
                style: const TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                isSubmitter
                    ? 'Đang chờ đối thủ kiểm tra và phản hồi.'
                    : 'Kiểm tra đội chiến thắng và danh sách thành viên trước khi xác nhận.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),

              if (pendingResult == null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                  ),
                  child: const Text(
                    'Không tìm thấy kết quả đang chờ duyệt.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFFB91C1C),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                )
              else ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 13,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFDBA74)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.emoji_events_rounded, color: _orange),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Kết quả được báo: Đội ${winningTeam ?? '?'} chiến thắng',
                          style: const TextStyle(
                            color: Color(0xFF9A3412),
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                _buildTeamCard(
                  teamNumber: 1,
                  players: _team1Players,
                  isWinner: winningTeam == 1,
                ),
                const SizedBox(height: 10),
                _buildTeamCard(
                  teamNumber: 2,
                  players: _team2Players,
                  isWinner: winningTeam == 2,
                ),
              ],

              const SizedBox(height: 20),

              if (isSubmitter)
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _purple,
                      side: const BorderSide(color: _purple),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(11),
                      ),
                    ),
                    child: const Text(
                      'Đóng',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                )
              else
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton(
                          onPressed: isSubmitting
                              ? null
                              : () => _handleRespond(false),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFEF4444),
                            side: const BorderSide(color: Color(0xFFEF4444)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(11),
                            ),
                          ),
                          child: const Text(
                            'Từ chối',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SizedBox(
                        height: 48,
                        child: ElevatedButton(
                          onPressed: isSubmitting || pendingResult == null
                              ? null
                              : () => _handleRespond(true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _orange,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(11),
                            ),
                          ),
                          child: isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text(
                                  'Xác nhận đúng',
                                  style: TextStyle(fontWeight: FontWeight.w800),
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
