/**
 * Notifications API Functions
 */

import apiClient from './client';
import { ENDPOINTS } from '../constants';

export const notificationsAPI = {
    /**
     * Get user's notifications
     */
    getNotifications: async (params = {}) => {
        const response = await apiClient.get(ENDPOINTS.NOTIFICATIONS, { params });
        return response; // interceptor already returns response.data
    },

    /**
     * Mark a notification as read
     */
    markAsRead: async (id) => {
        const response = await apiClient.patch(`${ENDPOINTS.NOTIFICATIONS}${id}/read/`);
        return response;
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async () => {
        const response = await apiClient.patch(`${ENDPOINTS.NOTIFICATIONS}read_all/`);
        return response;
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async () => {
        const response = await apiClient.get(ENDPOINTS.UNREAD_COUNT);
        return response;
    },

    /**
     * Delete a notification
     */
    deleteNotification: async (id) => {
        const response = await apiClient.delete(`${ENDPOINTS.NOTIFICATIONS}${id}/`);
        return response;
    },
};
