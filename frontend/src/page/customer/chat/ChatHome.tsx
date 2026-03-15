import {useRef} from "react";
import {FaCommentDots} from "react-icons/fa";
import ChatList from "./ChatList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";
import {useAuth} from "../../../context/AuthContext";
import {useChat} from "./useChat";

const ChatBoxHome = () => {
    const {user} = useAuth();
    const currentUserId = user?.userId || null;

    // Với màn hình full, chat box luôn luôn active
    const isChatActiveRef = useRef(true);
    const chatLogic = useChat(currentUserId, isChatActiveRef);

    return (
        <div
            className="flex overflow-hidden bg-gray-100"
            style={{height: "calc(100vh - 68px)"}}
        >
            <ChatList
                error={null} {...chatLogic}
                onChatSelect={chatLogic.handleChatSelect}
                showBorder
            />

            <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
                {chatLogic.selectedChat ? (
                    <>
                        <ChatHeader selectedChat={chatLogic.selectedChat}/>
                        <div className="flex-1 flex flex-col min-h-0 relative bg-gray-50 overflow-hidden">
                            <MessageList
                                messages={chatLogic.messages}
                                messagesEndRef={chatLogic.messagesEndRef}
                                currentUserId={currentUserId}
                                hasMore={chatLogic.hasMore}
                                loadMoreMessages={chatLogic.loadMoreMessages}
                                isFetchingMore={
                                    chatLogic.loading && chatLogic.messages.length > 0
                                }
                            />
                        </div>
                        <MessageInput
                            {...chatLogic}
                            onFileSelect={(e: any) => {
                                const file = e.target.files?.[0];
                                if (file)
                                    chatLogic.setSelectedFiles([
                                        {file, dataURL: URL.createObjectURL(file)},
                                    ]);
                            }}
                            onRemoveFile={() => chatLogic.setSelectedFiles([])}
                            onClearAllFiles={() => chatLogic.setSelectedFiles([])}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <div className="p-6 rounded-full bg-white shadow-sm mb-4">
                            <FaCommentDots size={48} className="opacity-20 text-blue-600"/>
                        </div>
                        <p className="font-medium">Chọn một cuộc trò chuyện để bắt đầu</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatBoxHome;
