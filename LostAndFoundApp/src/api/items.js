/**
 * Items API Functions (Lost and Found Items)
 */

import apiClient from './client';
import { ENDPOINTS } from '../constants';

export const itemsAPI = {
    // ==================== LOST ITEMS ====================

    /**
     * Get user's lost items
     */
    getLostItems: async (params = {}) => {
        const response = await apiClient.get(ENDPOINTS.LOST_ITEMS, { params });
        return response; // interceptor already returns response.data
    },

    /**
     * Get a specific lost item
     */
    getLostItem: async (id) => {
        const response = await apiClient.get(`${ENDPOINTS.LOST_ITEMS}${id}/`);
        return response;
    },

    /**
     * Create a new lost item report
     */
    createLostItem: async (itemData) => {
        const response = await apiClient.post(ENDPOINTS.LOST_ITEMS, itemData);
        return response;
    },

    /**
     * Update a lost item
     */
    updateLostItem: async (id, itemData) => {
        const response = await apiClient.patch(`${ENDPOINTS.LOST_ITEMS}${id}/`, itemData);
        return response;
    },

    /**
     * Delete a lost item
     */
    deleteLostItem: async (id) => {
        const response = await apiClient.delete(`${ENDPOINTS.LOST_ITEMS}${id}/`);
        return response;
    },

    /**
     * Get matches for a lost item
     */
    getLostItemMatches: async (id) => {
        const response = await apiClient.get(`${ENDPOINTS.LOST_ITEMS}${id}/matches/`);
        return response;
    },

    // ==================== FOUND ITEMS ====================

    /**
     * Get found items (available items for users, all for staff)
     */
    getFoundItems: async (params = {}) => {
        const response = await apiClient.get(ENDPOINTS.FOUND_ITEMS, { params });
        return response;
    },

    /**
     * Get a specific found item
     */
    getFoundItem: async (id) => {
        const response = await apiClient.get(`${ENDPOINTS.FOUND_ITEMS}${id}/`);
        return response;
    },

    /**
     * Create a new found item (staff only)
     */
    createFoundItem: async (itemData) => {
        const response = await apiClient.post(ENDPOINTS.FOUND_ITEMS, itemData);
        return response;
    },

    /**
     * Update a found item (staff only)
     */
    updateFoundItem: async (id, itemData) => {
        const response = await apiClient.patch(`${ENDPOINTS.FOUND_ITEMS}${id}/`, itemData);
        return response;
    },

    /**
     * Delete a found item (staff only)
     */
    deleteFoundItem: async (id) => {
        const response = await apiClient.delete(`${ENDPOINTS.FOUND_ITEMS}${id}/`);
        return response;
    },
};
