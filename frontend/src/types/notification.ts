export interface NotificationResponse {
    notificationId: string;
    notificationTitle: string;
    notificationBody: string;
    type: string;
    link: string;
    isRead: boolean;
    recipientId: string;
    createdAt: string;
}