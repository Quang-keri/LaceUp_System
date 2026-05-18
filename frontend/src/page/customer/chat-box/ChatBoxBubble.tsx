import React, { useState, useRef, useEffect } from "react";
import chatBotService from "../../../service/chatBotService";
import type { ChatbotRequest } from "../../../types/chatBox";
import {
  Send,
  Bot,
  X,
  Zap,
  ExternalLink,
  Banknote,
  MapPin,
  Star,
} from "lucide-react";

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
      text: "Chào bạn! Tôi là HLV Thể thao AI \nSẵn sàng lên kèo hay cần tư vấn chiến thuật nào?",
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

  const renderMessageContent = (msg: Message) => {
    if (msg.sender === "user") {
      return (
        <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed break-words">
          {msg.text}
        </p>
      );
    }

    const rentalRegex =
      /\[RENTAL\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
    const matches = [...msg.text.matchAll(rentalRegex)];

    if (matches.length > 0) {
      const cleanText = msg.text.replace(rentalRegex, "").trim();

      return (
        <div className="flex flex-col gap-3 w-full overflow-hidden">
          {cleanText && (
            <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed break-words">
              {cleanText}
            </p>
          )}

          {/* Thay đổi gap-2 thành gap-2.5 để các card có không gian thở */}
          <div className="flex flex-col gap-2.5 mt-1 w-full">
            {matches.map((match, idx) => {
              const [_, name, address, price, rating, url] = match;

              return (
                <a
                  key={idx}
                  href={url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  // THIẾT KẾ LẠI CARD TẠI ĐÂY
                  className="flex flex-col p-3.5 bg-white rounded-xl shadow-sm border border-purple-100 hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group w-full relative overflow-hidden"
                >
                  {/* Hiệu ứng nền siêu mờ khi hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/0 group-hover:from-orange-50/50 group-hover:to-transparent transition-colors duration-300 pointer-events-none"></div>

                  {/* Header: Tên sân & Nút Link tối giản */}
                  <div className="flex justify-between items-start gap-3 relative z-10 mb-2">
                    <span className="font-bold text-purple-900 line-clamp-2 flex-1 leading-snug text-[14px]">
                      {name.trim()}
                    </span>
                    <div className="text-slate-300 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-0.5">
                      <ExternalLink size={16} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Body: Thông tin chi tiết */}
                  <div className="flex flex-col gap-2 text-[12px] font-medium text-slate-500 relative z-10">
                    {/* Hàng 1: Địa chỉ */}
                    <div className="flex items-start gap-2">
                      <MapPin
                        size={14}
                        className="text-purple-400 mt-[2px] flex-shrink-0"
                      />
                      <span className="line-clamp-2 leading-tight">
                        {address.trim()}
                      </span>
                    </div>

                    {/* Hàng 2: Giá và Đánh giá (Có đường kẻ mỏng phân cách ở trên) */}
                    <div className="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-slate-100">
                      {/* Cột Giá */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Banknote
                          size={14}
                          className="text-emerald-500 flex-shrink-0"
                        />
                        <span className="line-clamp-1 truncate font-semibold text-slate-700">
                          {price.trim()}
                        </span>
                      </div>

                      {/* Cột Đánh Giá: Gọn và hài hòa hơn */}
                      <div className="flex items-center gap-1 flex-shrink-0 bg-orange-50/80 px-2 py-1 rounded border border-orange-100/50">
                        <span className="text-orange-600 font-bold leading-none mt-[1px] text-[11px]">
                          5/5
                        </span>
                        <Star
                          size={12}
                          className="text-orange-400 fill-orange-400 mb-[1px]"
                        />
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      );
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = msg.text.match(urlRegex);

    if (!urls) {
      return (
        <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed break-words">
          {msg.text}
        </p>
      );
    }

    const textWithoutUrls = msg.text.replace(urlRegex, "").trim();
    return (
      <div className="flex flex-col gap-3 w-full overflow-hidden">
        {textWithoutUrls && (
          <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed break-words">
            {textWithoutUrls}
          </p>
        )}
        <div className="flex flex-col gap-2 mt-1 w-full">
          {urls.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md group w-full bg-white border border-purple-100 hover:border-orange-400 hover:shadow-md text-purple-800"
            >
              <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                <span className="truncate">👉 Xem chi tiết tại đây</span>
              </div>
              <div className="text-slate-300 group-hover:text-orange-500 transition-colors flex-shrink-0">
                <ExternalLink size={18} strokeWidth={2.5} />
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-br from-purple-600 to-purple-800 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/40 hover:scale-110 hover:-rotate-12 transition-all duration-300 border-2 border-orange-500 group"
        >
          <Bot size={28} className="group-hover:animate-bounce" />
        </button>
      )}

      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[550px] max-h-[80vh] bg-slate-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200 transform transition-all duration-300 origin-bottom-right">
          <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 p-4 flex justify-between items-center border-b-[4px] border-orange-500 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ffffff_10px,#ffffff_20px)]"></div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-purple-900 shadow-inner">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-black tracking-widest uppercase italic text-lg leading-tight flex items-center gap-1">
                  LACE UP BOT{" "}
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
                  {renderMessageContent(msg)}
                </div>
              </div>
            ))}

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

          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-purple-100 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hỏi chiến thuật, sân bãi..."
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
