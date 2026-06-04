import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

import '../utils/constants.dart';
import '../views/area/area_detail/rental_area_detail_screen.dart';

class ChatBotService {
  static Future<String> asking(String message) async {
    try {
      // Gọi URL từ AppConstants
      final url = Uri.parse(AppConstants.chatBotUrl);

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'message': message,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(
            utf8.decode(response.bodyBytes));

        final resultText = responseData['result'] ?? responseData['data'];

        if (resultText != null) {
          return resultText.toString();
        } else {
          return "LaceUP AI: Dữ liệu trả về bị rỗng.";
        }
      } else {
        debugPrint('Lỗi Server: ${response.statusCode}');
        throw Exception('Lỗi API từ server');
      }
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

  ChatMessage({required this.id, required this.text, required this.isUser});
}

class ChatbotBubble extends StatelessWidget {
  const ChatbotBubble({super.key});

  void _openChat(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const ChatBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: () => _openChat(context),
      backgroundColor: Colors.purple.shade700,
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
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;

  final List<ChatMessage> _messages = [
    ChatMessage(
      id: '1',
      text: 'Chào bạn! Tôi là HLV Thể thao AI\nSẵn sàng lên kèo hay cần tư vấn chiến thuật nào?',
      isUser: false,
    ),
  ];

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 100,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _handleSendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    final newUserMsg = ChatMessage(
      id: DateTime.now().toString(),
      text: text,
      isUser: true,
    );

    setState(() {
      _messages.add(newUserMsg);
      _inputController.clear();
      _isLoading = true;
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

    try {
      final responseText = await ChatBotService.asking(newUserMsg.text);

      setState(() {
        _messages.add(
          ChatMessage(
            id: DateTime.now().toString(),
            text: responseText,
            isUser: false,
          ),
        );
      });
    } catch (e) {
      setState(() {
        _messages.add(
          ChatMessage(
            id: DateTime.now().toString(),
            text: "Trọng tài vừa thổi còi báo lỗi kết nối! Vui lòng thử lại sau.",
            isUser: false,
          ),
        );
      });
    } finally {
      setState(() => _isLoading = false);
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    }
  }

  void _navigateToDetail(String urlString) {
    try {
      final uri = Uri.parse(urlString.trim());

      final rentalAreaId = uri.pathSegments.isNotEmpty ? uri.pathSegments.last : '';

      if (rentalAreaId.isNotEmpty) {
        Navigator.pop(context);

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => RentalAreaDetailScreen(rentalAreaId: rentalAreaId),
          ),
        );
      } else {
        debugPrint('Không tìm thấy ID sân trong URL');
      }
    } catch (e) {
      debugPrint('Lỗi parse URL để lấy ID: $e');
      _launchExternalURL(urlString);
    }
  }

  Future<void> _launchExternalURL(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Widget _buildMessageContent(ChatMessage msg) {
    if (msg.isUser) {
      return Text(
        msg.text,
        style: const TextStyle(fontSize: 14, color: Colors.black87),
      );
    }

    final rentalRegex = RegExp(r'\[RENTAL\|([^\]]+)\]');
    final Iterable<RegExpMatch> matches = rentalRegex.allMatches(msg.text);

    if (matches.isNotEmpty) {
      final cleanText = msg.text.replaceAll(rentalRegex, '').trim();
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (cleanText.isNotEmpty) ...[
            Text(
              cleanText,
              style: const TextStyle(fontSize: 14, color: Colors.white),
            ),
            const SizedBox(height: 12),
          ],
          ...matches.map((match) {
            final content = match.group(1) ?? '';
            final parts = content.split('|');

            final name = parts.isNotEmpty ? parts[0] : '';
            final address = parts.length > 1 ? parts[1] : '';
            final price = parts.length > 2 ? parts[2] : '';

            final url = parts.isNotEmpty ? parts.last : '';

            return _buildRentalCard(name, address, price, url);
          }),
        ],
      );
    }

    return Text(
      msg.text,
      style: const TextStyle(fontSize: 14, color: Colors.white),
    );
  }

  Widget _buildRentalCard(String name, String address, String price,
      String url) {
    return GestureDetector(
      onTap: () => _navigateToDetail(url.trim()),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.purple.shade100),
          boxShadow: const [
            BoxShadow(
                color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
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
                    name.trim(),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Colors.purple.shade900,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.open_in_new, size: 16, color: Colors.orange),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on, size: 14, color: Colors.orange),
                // Tone màu cam
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    address.trim(),
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Divider(height: 1, thickness: 1),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.money, size: 14, color: Colors.green),
                    const SizedBox(width: 4),
                    Text(
                      price.trim(),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    border: Border.all(color: Colors.orange.shade200),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Row(
                    children: [
                      Text('5/5', style: TextStyle(fontSize: 11,
                          color: Colors.orange,
                          fontWeight: FontWeight.bold)),
                      SizedBox(width: 2),
                      Icon(Icons.star, size: 12, color: Colors.orange),
                    ],
                  ),
                )
              ],
            )
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery
        .of(context)
        .viewInsets
        .bottom;

    return Container(
      margin: EdgeInsets.only(top: kToolbarHeight, bottom: bottomInset),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF4A148C), Color(0xFF6A1B9A)], // Màu Tím
              ),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              border: Border(
                  bottom: BorderSide(color: Colors.orange, width: 3)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                        colors: [Colors.orange, Colors.deepOrange]),
                  ),
                  child: const Icon(
                      Icons.smart_toy, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'LACE UP BOT',
                        style: TextStyle(color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            fontSize: 16),
                      ),
                      Text(
                        'TRỢ LÝ AI 24/7',
                        style: TextStyle(color: Colors.orange,
                            fontSize: 10,
                            fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                )
              ],
            ),
          ),

          Expanded(
            child: Container(
              color: Colors.grey.shade50,
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length + (_isLoading ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _messages.length && _isLoading) {
                    return Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.purple.shade600,
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(16),
                            topRight: Radius.circular(16),
                            bottomRight: Radius.circular(16),
                          ),
                        ),
                        child: const SizedBox(
                          width: 24,
                          height: 12,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        ),
                      ),
                    );
                  }

                  final msg = _messages[index];
                  return Align(
                    alignment: msg.isUser ? Alignment.centerRight : Alignment
                        .centerLeft,
                    child: Container(
                      constraints: BoxConstraints(maxWidth: MediaQuery
                          .of(context)
                          .size
                          .width * 0.8),
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: msg.isUser ? Colors.white : Colors.purple
                            .shade600,
                        border: msg.isUser ? Border.all(color: Colors.purple
                            .shade100) : null,
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(16),
                          topRight: const Radius.circular(16),
                          bottomLeft: Radius.circular(msg.isUser ? 16 : 0),
                          bottomRight: Radius.circular(msg.isUser ? 0 : 16),
                        ),
                        boxShadow: const [
                          BoxShadow(color: Colors.black12,
                              blurRadius: 2,
                              offset: Offset(0, 1)),
                        ],
                      ),
                      child: _buildMessageContent(msg),
                    ),
                  );
                },
              ),
            ),
          ),

          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.purple.shade100)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    enabled: !_isLoading,
                    decoration: InputDecoration(
                      hintText: 'Hỏi chiến thuật, sân bãi...',
                      hintStyle: TextStyle(
                          color: Colors.grey.shade400, fontSize: 14),
                      filled: true,
                      fillColor: Colors.purple.shade50,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onSubmitted: (_) => _handleSendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: _isLoading ? null : _handleSendMessage,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.purple.shade800,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                        Icons.send, color: Colors.orange, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}