import { useState, useEffect, useRef } from "react";
import { FaTimes, FaMinus, FaCommentDots, FaArrowLeft } from "react-icons/fa";
import ChatList from "./ChatList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useUnreadMessages } from "../../../hooks/useUnreadMessages";
import { useAuth } from "../../../context/AuthContext";
import { useChat } from "./useChat";

const ChatBubble = () => {
  const { unreadCount } = useUnreadMessages(10000);
  const { user } = useAuth();
  const currentUserId = user?.userId || null;

  /* ---------- UI STATE ---------- */
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  // Ref để Hook biết Bubble có đang mở để đánh dấu đã đọc
  const isChatActiveRef = useRef(isOpen && !showChatList);
  useEffect(() => {
    isChatActiveRef.current = isOpen && !showChatList;
  }, [isOpen, showChatList]);

  /* ---------- GỌI HOOK CHUNG ---------- */
  const chatLogic = useChat(currentUserId, isChatActiveRef);

  /* ---------- XỬ LÝ SỰ KIỆN MỞ CHAT TỪ NGOÀI ---------- */
  useEffect(() => {
    const handleOpenChatFromExternal = async (event: any) => {
      const { userId, userName } = event.detail;
      setIsOpen(true);
      setIsMinimized(false);
      setShowChatList(false);

      const existingChat = chatLogic.conversations.find(
        (c) => String(c.otherPerson?.userId) === String(userId),
      );

      if (existingChat) {
        chatLogic.handleChatSelect(existingChat);
      } else {
        chatLogic.setSelectedChat({
          conversationId: null,
          user1: { userId: currentUserId!, userName: user?.userName || "" },
          user2: { userId, userName },
          otherPerson: { userId, userName },
          lastMessage: "",
          updatedAt: new Date().toISOString(),
        });
        chatLogic.setMessages([]);
      }
    };

    window.addEventListener("OPEN_CHAT_WITH_USER", handleOpenChatFromExternal);
    return () =>
      window.removeEventListener(
        "OPEN_CHAT_WITH_USER",
        handleOpenChatFromExternal,
      );
  }, [chatLogic.conversations, currentUserId, user]);

  if (window.location.pathname === "/chat") return null;

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center relative"
          >
            <FaCommentDots size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className={`active-chat-bubble fixed z-50 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border transition-all duration-300
  ${
    isMinimized
      ? "w-72 h-14 bottom-6 right-6"
      : "bottom-10 right-10 w-[320px] h-[480px] max-w-[calc(100vw-40px)] max-h-[calc(100vh-120px)]"
  }`}
        >
          <div className="px-4 py-3 bg-blue-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              {!showChatList && (
                <button
                  onClick={() => setShowChatList(true)}
                  className="hover:bg-blue-700 p-1 rounded-full transition-colors"
                >
                  <FaArrowLeft size={14} />
                </button>
              )}
              <span className="font-semibold truncate max-w-[180px]">
                {showChatList
                  ? "Đoạn chat"
                  : chatLogic.selectedChat?.otherPerson?.userName ||
                    "Người dùng"}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsMinimized(!isMinimized)}>
                <FaMinus size={12} />
              </button>
              <button onClick={() => setIsOpen(false)}>
                <FaTimes size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {showChatList ? (
                <ChatList
                  error={null}
                  {...chatLogic}
                  onChatSelect={(chat) => {
                    chatLogic.handleChatSelect(chat);
                    setShowChatList(false);
                  }}
                />
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <MessageList
                    messages={chatLogic.messages}
                    messagesEndRef={chatLogic.messagesEndRef}
                    currentUserId={currentUserId}
                    hasMore={chatLogic.hasMore}
                    loadMoreMessages={chatLogic.loadMoreMessages}
                    isFetchingMore={chatLogic.isFetchingMore}
                  />
                  <MessageInput
                    {...chatLogic}
                    onFileSelect={(e: any) => {
                      const file = e.target.files?.[0];
                      if (file)
                        chatLogic.setSelectedFiles([
                          { file, dataURL: URL.createObjectURL(file) },
                        ]);
                    }}
                    onRemoveFile={() => chatLogic.setSelectedFiles([])}
                    onClearAllFiles={() => chatLogic.setSelectedFiles([])}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBubble;
