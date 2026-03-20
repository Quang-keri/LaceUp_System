import { useState, useEffect, useRef } from "react";

import websocketService from "../../../service/websocketService.ts";
import chatService from "../../../service/chatService.ts";

export const useChat = (
  currentUserId: string | null,
  isChatActiveRef: React.MutableRefObject<boolean>,
) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentConversationIdRef = useRef<string | null>(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const pageSize = 20;

  const selectedChatRef = useRef(selectedChat);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  const loadConversations = async () => {
    if (!currentUserId) return;
    setLoading(true);
    const res = await chatService.getUserConversations(currentUserId);
    if (res.result && Array.isArray(res.result)) {
      const mapped = res.result.map((c: any) => {
        const other = c.user1?.userId === currentUserId ? c.user2 : c.user1;
        return {
          ...c,
          otherPerson: { userId: other.userId, userName: other.userName },
        };
      });
      setConversations(mapped);
    }
    setLoading(false);
  };

  // Trong useChat.ts - Tìm hàm loadMessages
  const loadMessages = async (id: string, isLoadMore = false) => {
    if (!id || (isLoadMore && (!hasMore || isFetchingMore))) return;

    if (isLoadMore) setIsFetchingMore(true);
    const currentPage = isLoadMore ? page + 1 : 0;

    try {
      const res = await chatService.getMessages(id, currentPage, pageSize);
      if (res.result && Array.isArray(res.result)) {
        const transformed = res.result.map((msg: any) => ({
          ...msg,
          sender: msg.senderId === currentUserId ? "user" : "other",
          isRead: msg.status === "READ",
        }));

        setMessages((prev) => {
          // Nếu loadMore (cuộn lên), nối vào ĐẦU. Nếu load lần đầu, lấy hoàn toàn tin nhắn mới
          const combined = isLoadMore ? [...transformed, ...prev] : transformed;

          // Lọc trùng theo messageId để chắc chắn không bị lặp tin nhắn
          const map = new Map();
          combined.forEach((m) => map.set(String(m.messageId), m));
          return Array.from(map.values()).sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        });

        setHasMore(res.result.length === pageSize);
        setPage(currentPage);
      }
    } catch (error) {
      console.error("Pagination error:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    loadConversations();

    const unsubscribeNewMsg = websocketService.onNewMessage((data: any) => {
      const incomingConvId = data.conversationId
        ? String(data.conversationId)
        : null;
      const currentConvId = currentConversationIdRef.current
        ? String(currentConversationIdRef.current)
        : null;

      const currentSelectedChat = selectedChatRef.current;

      const isMatchID = currentConvId === incomingConvId;
      const isNewChatMatch =
        !currentConvId &&
        currentSelectedChat?.otherPerson?.userId &&
        (data.senderId === currentSelectedChat.otherPerson.userId ||
          data.recipientId === currentSelectedChat.otherPerson.userId);

      if (isMatchID || isNewChatMatch) {
        if (!currentConvId && incomingConvId) {
          currentConversationIdRef.current = incomingConvId;
          setSelectedChat((prev: any) => ({
            ...prev,
            conversationId: incomingConvId,
          }));
        }

        const isMe = data.senderId === currentUserId;
        const isWatchingChat = isChatActiveRef.current;

        const incoming = {
          ...data,
          messageId: data.messageId || `msg-${Date.now()}`,
          sender: isMe ? "user" : "other",
          isRead: isMe ? false : isWatchingChat,
          status: isMe ? "SENT" : isWatchingChat ? "READ" : "SENT",
        };

        setMessages((prev) => {
          const isExisting = prev.some(
            (m) => String(m.messageId) === String(incoming.messageId),
          );
          if (isExisting) return prev;

          const isMeMsg = String(data.senderId) === String(currentUserId);
          let tempRemoved = false;

          const newMessages = [...prev];
          for (let i = newMessages.length - 1; i >= 0; i--) {
            const m = newMessages[i];
            if (
              isMeMsg &&
              m.isOptimistic &&
              m.content === incoming.content &&
              !tempRemoved
            ) {
              newMessages.splice(i, 1);
              tempRemoved = true;
              break;
            }
          }

          return [...newMessages, incoming];
        });

        if (isWatchingChat && !isMe && incomingConvId) {
          chatService.markMessageAsRead(incomingConvId, currentUserId);
        }
      }

      loadConversations();
    });

    const unsubscribeReadReceipt = websocketService.onReadReceipt(
      (data: any) => {
        // Log để kiểm tra xem receipt có về tới client không
        console.log("📩 Nhận được Read Receipt:", data);

        setMessages((prev) =>
          prev.map((m) => {
            // Nếu tin nhắn đó là do mình gửi (sender === "user")
            // và thuộc đúng hội thoại vừa được đọc
            if (
              m.sender === "user" &&
              String(data.conversationId) ===
                String(currentConversationIdRef.current)
            ) {
              return { ...m, isRead: true, status: "READ" };
            }
            return m;
          }),
        );
        loadConversations(); // Để cập nhật icon/số thông báo ở danh sách ngoài
      },
    );

    return () => {
      unsubscribeNewMsg();
      unsubscribeReadReceipt();
    };
  }, [currentUserId]);

  const handleSendMessage = async () => {
    // LOG 1: Kiểm tra trạng thái đầu vào
    console.log("=== DEBUG SEND MESSAGE ===");
    console.log("1. Current User ID (Sender):", currentUserId);
    console.log("2. Selected Chat Object:", selectedChat);
    console.log("3. Recipient ID:", selectedChat?.otherPerson?.userId);
    console.log("4. Raw Message:", newMessage);

    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!selectedChat || !currentUserId) {
      console.error("LỖI: Thiếu selectedChat hoặc currentUserId");
      return;
    }

    const recipientId = selectedChat.otherPerson?.userId;

    // LOG 2: Kiểm tra định dạng ID trước khi bắn request
    if (recipientId?.includes("@") || currentUserId?.includes("@")) {
      console.error("CHẶN GỬI: Phát hiện Email trong trường ID!", {
        sender: currentUserId,
        recipient: recipientId,
      });
      alert(
        "Lỗi dữ liệu: Hệ thống đang nhận nhầm Email thay vì ID. Vui lòng kiểm tra log.",
      );
      return;
    }

    const targetConversationId =
      currentConversationIdRef.current || selectedChat.conversationId;

    if (selectedFiles.length > 0 && selectedFiles[0]) {
      console.log("Nhánh: Gửi kèm ảnh (HTTP)");
      try {
        const messageRequest = {
          content: newMessage.trim(),
          recipientId: recipientId,
          conversationId: targetConversationId || undefined,
        };

        // LOG 3: Payload thực tế gửi lên qua API
        console.log("Payload gửi qua API:", messageRequest);

        const fileToSend = selectedFiles[0].file;
        const res = await chatService.sendMessageWithImage(
          messageRequest,
          fileToSend,
        );
        console.log("Kết quả API:", res);

        setNewMessage("");
        setSelectedFiles([]);
      } catch (err) {
        console.error("Lỗi gửi ảnh:", err);
      }
    } else {
      console.log("Nhánh: Gửi văn bản thuần");
      const content = newMessage.trim();

      if (websocketService.isConnected()) {
        const wsPayload = {
          senderId: currentUserId,
          recipientId,
          content,
          conversationId: targetConversationId,
        };
        // LOG 4: Dữ liệu gửi qua Websocket
        console.log("Payload gửi qua WS:", wsPayload);

        websocketService.send("/app/chat", wsPayload);

        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
          messageId: tempId,
          senderId: currentUserId,
          conversationId: targetConversationId,
          sender: "user",
          content,
          createdAt: new Date().toISOString(),
          isRead: false,
          status: "SENT",
          isOptimistic: true,
        };
        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage("");
      } else {
        console.warn(
          "WS chưa kết nối, bạn có muốn fallback sang gọi API không?",
        );
        // Nếu muốn không bao giờ bị lỗi 'WS chưa kết nối', hãy copy logic gọi API ở trên vào đây
      }
    }
  };

  const handleChatSelect = async (chat: any) => {
    const isChangingConversation =
      currentConversationIdRef.current !== chat.conversationId;
    setSelectedChat(chat);
    currentConversationIdRef.current = chat.conversationId;

    if (chat.conversationId) {
      // GỌI NGAY: Đánh dấu đã đọc khi click vào chat
      chatService.markMessageAsRead(chat.conversationId, currentUserId!);

      if (isChangingConversation) {
        setPage(0);
        setHasMore(true);
        await loadMessages(chat.conversationId, false);
      }
    }
  };

  const loadMoreMessages = () => {
    if (currentConversationIdRef.current) {
      loadMessages(currentConversationIdRef.current, true);
    }
  };

  return {
    conversations,
    messages,
    selectedChat,
    setSelectedChat,
    setMessages,
    newMessage,
    setNewMessage,
    selectedFiles,
    setSelectedFiles,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    loading,
    messagesEndRef,
    handleSendMessage,
    handleChatSelect,
    hasMore,
    loadMoreMessages,
    isFetchingMore,
  };
};
