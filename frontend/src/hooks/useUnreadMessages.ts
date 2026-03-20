import { useState, useEffect } from 'react';

interface UseUnreadMessagesReturn {
    unreadMessages: any[];
    unreadCount: number;
}

// @ts-ignore - Will be implemented later
import chatService from "../service/chatService";

export const useUnreadMessages = (pollInterval: number = 10000): UseUnreadMessagesReturn => {
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [unreadMessages, setUnreadMessages] = useState<any[]>([]);

    useEffect(() => {
        const getCurrentUserId = (): string | null => {
            try {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo) as { userId: string };
                    return user.userId;
                }
            } catch (error) {
                console.error('Error parsing userInfo:', error);
            }
            return null;
        };

        const fetchUnreadCount = async () => {
            const currentUserId = getCurrentUserId();
            if (!currentUserId) {
                setUnreadCount(0);
                setUnreadMessages([]);
                return;
            }

            try {
                // TEMPLATE MODE: Calculate unread count from mock data
                const response = await chatService.getUserConversations(currentUserId);
                if (response.result) {
                    let count = 0;
                    const unread: any[] = [];

                    // Count unread messages from conversations
                    // In template mode, we check if lastMessage is from other user and not read
                    for (const conv of response.result) {
                        // Simple check: if conversation has unread indicator
                        // In real app, this would come from API
                        if (conv.lastMessage && conv.user1?.userId !== currentUserId && conv.user2?.userId !== currentUserId) {
                            // This is a simplified check - in real app, API would provide unread count
                            count += 1;
                        }
                    }

                    setUnreadCount(count);
                    setUnreadMessages(unread);
                }
            } catch (error) {
                console.error('Error fetching unread messages:', error);
                setUnreadCount(0);
                setUnreadMessages([]);
            }
        };

        // Initial fetch
        fetchUnreadCount();

        // Poll for unread messages
        const interval = setInterval(fetchUnreadCount, pollInterval);

        return () => {
            clearInterval(interval);
        };
    }, [pollInterval]);

    return {
        unreadMessages,
        unreadCount
    };
};
