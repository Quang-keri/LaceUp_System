import api from "./../config/axios";
import type {NotificationResponse} from "../types/notification.ts";
import type {ApiResponse} from "../types/ApiResponse.ts";
import type {PageResponse} from "../types/PageResponse.ts";

const notificationService = {

    getMyNotifications: async (
        page: number = 0,
        size: number = 10
    ): Promise<ApiResponse<PageResponse<NotificationResponse>>> => {
        const response = await api.get<ApiResponse<PageResponse<NotificationResponse>>>(
            `/notifications/my-notification`,
            {
                params: { page, size },
            }
        );
        return response.data;
    },

    markAsRead: async (notificationId: string): Promise<ApiResponse<void>> => {
        const response = await api.patch<ApiResponse<void>>(
            `/notifications/${notificationId}/read`,
        );
        return response.data;
    },

    markAllAsRead: async (): Promise<ApiResponse<void>> => {
        const response = await api.patch<ApiResponse<void>>(
            `/notifications/read-all`,
        );
        return response.data;
    },

    deleteNotification: async (
        notificationId: string,
    ): Promise<ApiResponse<void>> => {
        const response = await api.delete<ApiResponse<void>>(
            `/notifications/${notificationId}`,
        );
        return response.data;
    },
};

export default notificationService;
