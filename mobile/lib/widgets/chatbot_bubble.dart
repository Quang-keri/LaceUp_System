import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

import '../utils/constants.dart';
import '../views/area/area_detail/rental_area_detail_screen.dart';

class ChatBotService {
  static Future<String> asking(String message) async {
    try {
      final url = Uri.parse(AppConstants.chatBotUrl);

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({'message': message}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(
          utf8.decode(response.bodyBytes),
        );

        final resultText = responseData['result'] ?? responseData['data'];

        if (resultText != null) {
          return resultText.toString();
        }

        return 'LaceUP AI: Dữ liệu trả về bị rỗng.';
      }

      debugPrint(
        'Lỗi Server Chatbot: ${response.statusCode} - ${response.body}',
      );
      throw Exception('Lỗi API từ server');
    } catch (e) {
      debugPrint('Lỗi kết nối API Chatbot: $e');
      throw Exception('Không thể kết nối đến máy chủ.');
    }
  }
}

class ChatMessage {
  final String id;
  final String text;
  final bool isUser;

  const ChatMessage({
    required this.id,
    required this.text,
    required this.isUser,
  });
}

class ChatbotBubble extends StatelessWidget {
  const ChatbotBubble({super.key});

  void _openChat(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: false,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black45,
      builder: (_) => const ChatBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: () => _openChat(context),
      backgroundColor: const Color(0xFF6A1B9A),
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(30),
        side: const BorderSide(color: Colors.orange, width: 2),
      ),
      child: const Icon(Icons.smart_toy, color: Colors.white, size: 28),
    );
  }
}

class ChatBottomSheet extends StatefulWidget {
  const ChatBottomSheet({super.key});

  @override
  State<ChatBottomSheet> createState() => _ChatBottomSheetState();
}

class _ChatBottomSheetState extends State<ChatBottomSheet> {
  static const Color _primaryPurple = Color(0xFF6A1B9A);
  static const Color _messagePurple = Color(0xFF9C27B0);

  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _inputFocusNode = FocusNode();

  bool _isLoading = false;

  final List<ChatMessage> _messages = const [
    ChatMessage(
      id: '1',
      text:
          'Chào bạn! Tôi là HLV Thể thao AI\n'
          'Sẵn sàng lên kèo hay cần tư vấn chiến thuật nào?',
      isUser: false,
    ),
  ].toList();

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    _inputFocusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scrollController.hasClients) return;

      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _handleSendMessage() async {
    final text = _inputController.text.trim();

    if (text.isEmpty || _isLoading) return;

    final userMessage = ChatMessage(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      text: text,
      isUser: true,
    );

    setState(() {
      _messages.add(userMessage);
      _inputController.clear();
      _isLoading = true;
    });

    _scrollToBottom();

    try {
      final responseText = await ChatBotService.asking(userMessage.text);

      if (!mounted) return;

      setState(() {
        _messages.add(
          ChatMessage(
            id: DateTime.now().microsecondsSinceEpoch.toString(),
            text: responseText,
            isUser: false,
          ),
        );
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _messages.add(
          ChatMessage(
            id: DateTime.now().microsecondsSinceEpoch.toString(),
            text:
                'Trọng tài vừa thổi còi báo lỗi kết nối! '
                'Vui lòng thử lại sau.',
            isUser: false,
          ),
        );
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
        _scrollToBottom();
      }
    }
  }

  Future<void> _navigateToDetail(String urlString) async {
    try {
      final uri = Uri.parse(urlString.trim());

      final validSegments = uri.pathSegments
          .where((segment) => segment.trim().isNotEmpty)
          .toList();

      final rentalAreaId = validSegments.isNotEmpty
          ? validSegments.last.trim()
          : '';

      if (rentalAreaId.isEmpty) {
        await _launchExternalURL(urlString);
        return;
      }

      if (!mounted) return;

      Navigator.pop(context);

      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => RentalAreaDetailScreen(rentalAreaId: rentalAreaId),
        ),
      );
    } catch (e) {
      debugPrint('Lỗi parse URL để lấy ID sân: $e');
      await _launchExternalURL(urlString);
    }
  }

  Future<void> _launchExternalURL(String urlString) async {
    final url = Uri.tryParse(urlString.trim());

    if (url == null) return;

    final canLaunch = await canLaunchUrl(url);

    if (canLaunch) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  /// Nhận các chuỗi như:
  /// "80,000 VNĐ - 200,000 VNĐ/giờ"
  /// "80000 - 200000"
  /// "80.000đ"
  ///
  /// Và chỉ hiển thị giá thấp nhất: "Từ 80k VNĐ".
  String _formatMinimumPrice(String rawPrice) {
    final matches = RegExp(r'\d[\d.,]*').allMatches(rawPrice).toList();

    if (matches.isEmpty) {
      return rawPrice.trim().isEmpty ? 'Liên hệ' : rawPrice.trim();
    }

    int? minimumPrice;

    for (final match in matches) {
      final digits = (match.group(0) ?? '').replaceAll(RegExp(r'[^\d]'), '');

      final parsedValue = int.tryParse(digits);

      if (parsedValue == null || parsedValue <= 0) continue;

      if (minimumPrice == null || parsedValue < minimumPrice) {
        minimumPrice = parsedValue;
      }
    }

    if (minimumPrice == null) {
      return rawPrice.trim().isEmpty ? 'Liên hệ' : rawPrice.trim();
    }

    if (minimumPrice >= 1000000) {
      final millionValue = minimumPrice / 1000000;
      final displayValue = millionValue == millionValue.roundToDouble()
          ? millionValue.toInt().toString()
          : millionValue.toStringAsFixed(1);

      return 'Từ ${displayValue}tr VNĐ';
    }

    if (minimumPrice >= 1000) {
      final thousandValue = minimumPrice / 1000;
      final displayValue = thousandValue == thousandValue.roundToDouble()
          ? thousandValue.toInt().toString()
          : thousandValue.toStringAsFixed(1);

      return 'Từ ${displayValue}k VNĐ';
    }

    return 'Từ $minimumPrice VNĐ';
  }

  Widget _buildMessageContent(ChatMessage message) {
    if (message.isUser) {
      return Text(
        message.text,
        style: const TextStyle(
          fontSize: 14,
          height: 1.4,
          color: Colors.black87,
        ),
      );
    }

    final rentalRegex = RegExp(r'\[RENTAL\|([^\]]+)\]');
    final matches = rentalRegex.allMatches(message.text).toList();

    if (matches.isEmpty) {
      return Text(
        message.text,
        style: const TextStyle(fontSize: 14, height: 1.4, color: Colors.white),
      );
    }

    final cleanText = message.text.replaceAll(rentalRegex, '').trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (cleanText.isNotEmpty) ...[
          Text(
            cleanText,
            style: const TextStyle(
              fontSize: 14,
              height: 1.4,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
        ],
        ...matches.map((match) {
          final content = match.group(1) ?? '';
          final parts = content.split('|');

          final name = parts.isNotEmpty ? parts[0].trim() : '';
          final address = parts.length > 1 ? parts[1].trim() : '';
          final price = parts.length > 2 ? parts[2].trim() : '';
          final url = parts.length > 3 ? parts.last.trim() : '';

          return _buildRentalCard(
            name: name,
            address: address,
            price: price,
            url: url,
          );
        }),
      ],
    );
  }

  Widget _buildRentalCard({
    required String name,
    required String address,
    required String price,
    required String url,
  }) {
    return GestureDetector(
      onTap: url.isEmpty ? null : () => _navigateToDetail(url),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.purple.shade100),
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    name.isEmpty ? 'Sân thể thao' : name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      height: 1.25,
                      color: Colors.purple.shade900,
                    ),
                  ),
                ),
                if (url.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.open_in_new_rounded,
                    size: 17,
                    color: Colors.orange,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 9),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.location_on_rounded,
                  size: 16,
                  color: Colors.orange,
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    address.isEmpty ? 'Chưa cập nhật địa chỉ' : address,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      height: 1.35,
                      color: Colors.grey,
                    ),
                  ),
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 9),
              child: Divider(height: 1, thickness: 1),
            ),
            Row(
              children: [
                const Icon(
                  Icons.payments_outlined,
                  size: 16,
                  color: Colors.green,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _formatMinimumPrice(price),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      color: Colors.black87,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 7,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    border: Border.all(color: Colors.orange.shade200),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '5/5',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.orange,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(width: 3),
                      Icon(Icons.star_rounded, size: 13, color: Colors.orange),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingMessage() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          color: _messagePurple,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
            bottomRight: Radius.circular(16),
          ),
        ),
        child: const SizedBox(
          width: 24,
          height: 12,
          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final maxBubbleWidth = screenWidth * 0.84;

    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: maxBubbleWidth),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: message.isUser ? Colors.white : _messagePurple,
          border: message.isUser
              ? Border.all(color: Colors.purple.shade100)
              : null,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(message.isUser ? 16 : 4),
            bottomRight: Radius.circular(message.isUser ? 4 : 16),
          ),
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 3,
              offset: Offset(0, 1),
            ),
          ],
        ),
        child: _buildMessageContent(message),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [Color(0xFF4A148C), _primaryPurple]),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(bottom: BorderSide(color: Colors.orange, width: 3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [Colors.orange, Colors.deepOrange],
              ),
            ),
            child: const Icon(Icons.smart_toy, color: Colors.white, size: 21),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'LACE UP BOT',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontStyle: FontStyle.italic,
                    fontSize: 16,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'TRỢ LÝ AI 24/7',
                  style: TextStyle(
                    color: Colors.orange,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Đóng',
            icon: const Icon(
              Icons.close_rounded,
              color: Colors.white,
              size: 28,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.purple.shade100)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _inputController,
              focusNode: _inputFocusNode,
              enabled: !_isLoading,
              minLines: 1,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.send,
              decoration: InputDecoration(
                hintText: 'Hỏi về sân bãi...',
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                filled: true,
                fillColor: Colors.purple.shade50,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide(color: Colors.purple.shade200),
                ),
              ),
              onSubmitted: (_) => _handleSendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _isLoading ? null : _handleSendMessage,
              borderRadius: BorderRadius.circular(18),
              child: Ink(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: _isLoading ? Colors.grey.shade300 : _primaryPurple,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Icon(
                  _isLoading ? Icons.hourglass_top_rounded : Icons.send_rounded,
                  color: _isLoading ? Colors.grey.shade500 : Colors.orange,
                  size: 23,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final keyboardInset = mediaQuery.viewInsets.bottom;
    final navigationBarInset = mediaQuery.viewPadding.bottom;

    return AnimatedPadding(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOut,
      padding: EdgeInsets.only(bottom: keyboardInset),
      child: Padding(
        padding: EdgeInsets.only(
          bottom: keyboardInset > 0 ? 0 : navigationBarInset,
        ),
        child: FractionallySizedBox(
          heightFactor: 0.94,
          child: Material(
            color: Colors.transparent,
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(24),
              ),
              child: Container(
                color: Colors.white,
                child: Column(
                  children: [
                    _buildHeader(),
                    Expanded(
                      child: Container(
                        color: Colors.grey.shade50,
                        child: ListView.builder(
                          controller: _scrollController,
                          keyboardDismissBehavior:
                              ScrollViewKeyboardDismissBehavior.onDrag,
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                          itemCount: _messages.length + (_isLoading ? 1 : 0),
                          itemBuilder: (_, index) {
                            if (_isLoading && index == _messages.length) {
                              return _buildLoadingMessage();
                            }

                            return _buildMessageBubble(_messages[index]);
                          },
                        ),
                      ),
                    ),
                    _buildInputArea(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
