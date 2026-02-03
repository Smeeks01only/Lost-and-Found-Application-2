/**
 * Authentication API Functions
 */

import apiClient from './client';
import { ENDPOINTS } from '../constants';

export const authAPI = {
    /**
     * Login user with email and password
     */
    login: async (email, password) => {
        const response = await apiClient.post(ENDPOINTS.LOGIN, { email, password });
        return response; // interceptor already returns response.data
    },

    /**
     * Register a new user
     */
    register: async (userData) => {
        const response = await apiClient.post(ENDPOINTS.REGISTER, userData);
        return response;
    },

    /**
     * Refresh access token
     */
    refreshToken: async (refreshToken) => {
        const response = await apiClient.post(ENDPOINTS.REFRESH_TOKEN, { refresh: refreshToken });
        return response;
    },

    /**
     * Logout user
     */
    logout: async () => {
        const response = await apiClient.post(ENDPOINTS.LOGOUT);
        return response;
    },

    /**
     * Get current user profile
     */
    getProfile: async () => {
        const response = await apiClient.get(ENDPOINTS.PROFILE);
        return response;
    },

    /**
     * Update user profile
     */
    updateProfile: async (profileData) => {
        const response = await apiClient.patch(ENDPOINTS.PROFILE, profileData);
        return response;
    },

    /**
     * Change password
     */
    changePassword: async (oldPassword, newPassword) => {
        const response = await apiClient.post(ENDPOINTS.CHANGE_PASSWORD, {
            old_password: oldPassword,
            new_password: newPassword,
        });
        return response;
    },
};

