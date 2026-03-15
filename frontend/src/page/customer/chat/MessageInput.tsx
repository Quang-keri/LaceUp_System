import React, { useState, useRef, useEffect } from "react";
import {
    FaPaperPlane,
    FaSmile,
    FaImage,
} from "react-icons/fa";
import EmojiPicker from "./EmojiPicker";
import FilePreview from "./FileReview.tsx";


interface FileItem {
    file: File;
    dataURL?: string;
}

interface MessageInputProps {
    newMessage: string;
    setNewMessage: (message: string | ((prev: string) => string)) => void;
    handleSendMessage: () => void;
    selectedFiles: FileItem[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;

    // Thêm dấu ? vào các dòng dưới đây
    imagePreview?: string | null;
    setImagePreview?: React.Dispatch<React.SetStateAction<string | null>>;
    isRecording?: boolean;
    onVoiceRecord?: () => void;
    onRemoveImagePreview?: () => void;

    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (index: number) => void;
    onClearAllFiles: () => void;
    isDarkMode?: boolean;
}

const quickReplies = [
    "Phòng còn trống không ạ?",
    "Địa chỉ cụ thể ở đâu ạ?",
    "Giá thuê theo giờ bao nhiêu?",
    "Có máy chiếu/wifi không ạ?",
    "Cảm ơn"
];

const MessageInput = ({
                          newMessage,
                          setNewMessage,
                          handleSendMessage,
                          selectedFiles,
                          imagePreview,
                          onFileSelect,
                          onRemoveFile,
                          onRemoveImagePreview,
                          onClearAllFiles,
                          isDarkMode = false,
                      }: MessageInputProps) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    // Inject compact scrollbar for quick replies
    useEffect(() => {
        const id = "quick-replies-scroll-style";
        if (!document.getElementById(id)) {
            const style = document.createElement("style");
            style.id = id;
            style.innerHTML = `
        .quick-replies{ scrollbar-width: thin; }
        .quick-replies::-webkit-scrollbar{ height: 6px; }
        .quick-replies::-webkit-scrollbar-track{ background: transparent; }
        .quick-replies::-webkit-scrollbar-thumb{ background-color: #4da6ff; border-radius: 9999px; }
      `;
            document.head.appendChild(style);
        }
    }, []);

    const handleQuickReply = (reply: string) => {
        setNewMessage(reply);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            // Chỉ gửi khi có nội dung hoặc có file được chọn
            if (newMessage.trim() || selectedFiles.length > 0) {
                handleSendMessage();
            }
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setNewMessage((prev: string) => prev + emoji);
        setShowEmojiPicker(false);
    };

    return (
        <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} px-4 py-3 flex-shrink-0`}
        >
            {/* File Preview */}
            <FilePreview
                imagePreview={imagePreview}
                selectedFiles={selectedFiles}
                onRemoveImagePreview={onRemoveImagePreview}
                onRemoveFile={onRemoveFile}
                onClearAllFiles={onClearAllFiles}
            />

            {/* Quick Reply Bubbles */}
            <div className="flex gap-2 mb-3 overflow-x-auto quick-replies">
                {quickReplies.map((reply, index) => (
                    <button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        className={`flex-shrink-0 px-3 py-2 text-sm rounded-full transition-colors ${
                            isDarkMode
                                ? "bg-gray-700 text-white hover:bg-gray-600"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        {reply}
                    </button>
                ))}
            </div>

            {/* Input Field */}
            <div className="flex items-center gap-3">
                {/* Emoji Picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2 transition-colors ${isDarkMode ? "text-gray-300 hover:text-gray-100" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <FaSmile className="w-4 h-4" />
                    </button>

                    {showEmojiPicker && (
                        <EmojiPicker
                            ref={emojiPickerRef}
                            onEmojiSelect={handleEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                        />
                    )}
                </div>

                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={`w-full px-4 py-3 rounded-full focus:ring-2 focus:ring-[#4da6ff] outline-none transition-colors ${
                            isDarkMode
                                ? "bg-gray-700 text-white placeholder-gray-400 border border-gray-600 hover:border-[#4da6ff] focus:border-[#4da6ff]"
                                : "bg-white text-gray-900 placeholder-gray-500 border border-gray-300 hover:border-[#4da6ff] focus:border-[#4da6ff]"
                        }`}
                    />
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 transition-colors ${isDarkMode ? "text-gray-300 hover:text-gray-100" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <FaImage className="w-4 h-4" />
                </button>

                <button
                    onClick={handleSendMessage}
                    className="p-2 bg-[#4da6ff] hover:bg-[#4da6ff]/90 text-white rounded-full transition-colors"
                >
                    <FaPaperPlane className="w-4 h-4" />
                </button>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={onFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />
        </div>
    );
};

export default MessageInput;
