/**
 * Matches and Claims API Functions
 */

import apiClient from './client';
import { ENDPOINTS } from '../constants';

export const matchesAPI = {
    // ==================== MATCHES ====================

    /**
     * Get all matches for the user
     */
    getMatches: async (params = {}) => {
        const response = await apiClient.get(ENDPOINTS.MATCHES, { params });
        return response; // interceptor already returns response.data
    },

    /**
     * Get a specific match with full details
     */
    getMatch: async (id) => {
        const response = await apiClient.get(`${ENDPOINTS.MATCHES}${id}/`);
        return response;
    },

    /**
     * Submit a claim for a match
     */
    submitClaim: async (matchId, claimData) => {
        const response = await apiClient.post(
            `${ENDPOINTS.MATCHES}${matchId}/claim/`,
            claimData
        );
        return response;
    },

    // ==================== CLAIMS ====================

    /**
     * Get user's claims
     */
    getClaims: async (params = {}) => {
        const response = await apiClient.get(ENDPOINTS.CLAIMS, { params });
        return response;
    },

    /**
     * Get a specific claim
     */
    getClaim: async (id) => {
        const response = await apiClient.get(`${ENDPOINTS.CLAIMS}${id}/`);
        return response;
    },

    /**
     * Get pending claims (admin only)
     */
    getPendingClaims: async () => {
        const response = await apiClient.get(ENDPOINTS.PENDING_CLAIMS);
        return response;
    },

    /**
     * Review a claim (admin only)
     */
    reviewClaim: async (id, reviewData) => {
        const response = await apiClient.post(
            `${ENDPOINTS.CLAIMS}${id}/review/`,
            reviewData
        );
        return response;
    },
};
