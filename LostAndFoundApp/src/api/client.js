/**
 * API Client with Axios
 * Handles authentication tokens and request/response interceptors
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, ENDPOINTS } from '../constants';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        console.log('API Error:', {
            url: originalRequest?.url,
            method: originalRequest?.method,
            status: error.response?.status,
            data: error.response?.data,
            sentData: originalRequest?.data
        });

        // Handle 401 (Unauthorized) - Token refresh logic
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Call refresh endpoint directly to avoid infinite loops
                const response = await axios.post(`${API_BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;
                await AsyncStorage.setItem('accessToken', access);

                // Update authorization header
                originalRequest.headers['Authorization'] = `Bearer ${access}`;
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed - logout user
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
                // You might want to trigger a redirect to login here
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
