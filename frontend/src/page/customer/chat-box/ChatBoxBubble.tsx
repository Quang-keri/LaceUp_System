import React, { useState, useRef, useEffect } from "react";
import chatBotService from "../../../service/chatBotService";
import type { ChatbotRequest } from "../../../types/chatBox";
import { Send, Bot, X, Zap } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

const ChatboxBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Chào bạn! Tôi là HLV Thể thao AI ⚡\nSẵn sàng lên kèo hay cần tư vấn chiến thuật nào?",
      sender: "bot",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");
    setIsLoading(true);

    const requestPayload: ChatbotRequest = {
      message: newUserMsg.text,
    };

    try {
      const response = await chatBotService.asking(requestPayload.message);

      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        text:
          response.result ||
          "Tôi chưa hiểu ý bạn lắm. Nháp lại pha bóng này nhé!",
        sender: "bot",
      };
      setMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Trọng tài vừa thổi còi báo lỗi kết nối! Vui lòng thử lại sau.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans">
      {/* Nút Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-br from-purple-600 to-purple-800 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/40 hover:scale-110 hover:-rotate-12 transition-all duration-300 border-2 border-orange-500 group"
        >
          <Bot size={28} className="group-hover:animate-bounce" />
        </button>
      )}

      {/* Khung Chat */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[550px] max-h-[80vh] bg-slate-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200 transform transition-all duration-300 origin-bottom-right">
          {/* Header Thể Thao Tím/Cam */}
          <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 p-4 flex justify-between items-center border-b-[4px] border-orange-500 relative overflow-hidden">
            {/* Hiệu ứng pattern chéo nền cho header */}
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ffffff_10px,#ffffff_20px)]"></div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-purple-900 shadow-inner">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-black tracking-widest uppercase italic text-lg leading-tight flex items-center gap-1">
                  SPORTBOT{" "}
                  <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                </h3>
                <p className="text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                  Trợ lý AI 24/7
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="relative z-10 text-purple-300 hover:text-white bg-purple-900/50 hover:bg-orange-500 p-1.5 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Vùng hiển thị tin nhắn */}
          <div className="flex-1 p-4 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 flex flex-col gap-4 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] flex flex-col ${
                  msg.sender === "user"
                    ? "self-end items-end"
                    : "self-start items-start"
                }`}
              >
                <div
                  className={`p-3.5 rounded-2xl shadow-sm relative ${
                    msg.sender === "user"
                      ? "bg-white border border-purple-100 text-slate-700 rounded-br-sm"
                      : "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-bl-sm shadow-purple-200/50"
                  }`}
                >
                  <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 px-1">
                  {msg.sender === "user" ? "BẠN" : "SPORTBOT"}
                </span>
              </div>
            ))}

            {/* Hiệu ứng đang gõ */}
            {isLoading && (
              <div className="self-start max-w-[80%] flex flex-col items-start">
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-3.5 rounded-2xl rounded-bl-sm shadow-sm flex gap-1 items-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Vùng nhập tin nhắn */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-purple-100 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hỏi chiến thuật, kèo đấu..."
              className="flex-1 px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm font-medium text-slate-700 placeholder-slate-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-purple-800 text-orange-400 p-3 rounded-xl flex items-center justify-center hover:bg-orange-500 hover:text-white disabled:opacity-50 disabled:hover:bg-purple-800 disabled:hover:text-orange-400 transition-colors shadow-sm"
            >
              <Send
                size={20}
                className={
                  inputValue.trim()
                    ? "translate-x-0.5 -translate-y-0.5 transition-transform"
                    : ""
                }
              />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatboxBubble;
