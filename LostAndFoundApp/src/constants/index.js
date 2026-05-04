/**
 * API Configuration and Constants
 */

import { Platform } from 'react-native';

// Base URL for the backend API
const getBaseUrl = () => {
    if (Platform.OS === 'web') return 'http://localhost:8000/api/v1';
    if (Platform.OS === 'android') return 'http://192.168.1.105:8000/api/v1'; // Physical device IP
    // if (Platform.OS === 'android') return 'http://10.0.2.2:8000/api/v1'; // Emulator default

    return 'http://localhost:8000/api/v1'; // iOS Simulator default
};

export const API_BASE_URL = getBaseUrl();

// API Endpoints
export const ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    REFRESH_TOKEN: '/auth/refresh/',
    LOGOUT: '/auth/logout/',
    PROFILE: '/auth/profile/',
    CHANGE_PASSWORD: '/auth/change-password/',

    // Lost Items
    LOST_ITEMS: '/lost-items/',

    // Found Items
    FOUND_ITEMS: '/found-items/',

    // Matches
    MATCHES: '/matches/',
    RUN_MATCHING: '/matches/run/',

    // Claims
    CLAIMS: '/claims/',
    PENDING_CLAIMS: '/claims/pending/',

    // Notifications
    NOTIFICATIONS: '/notifications/',
    UNREAD_COUNT: '/notifications/unread_count/',

    // Admin User Management
    USERS: '/auth/users/',
    USER_STATS: '/auth/users/stats/',
};

// App Colors
export const COLORS = {
    primary: '#4F46E5',    // Indigo 600
    // Indigo 700
    primaryLight: '#818CF8', // Indigo 400
    primaryFaded: 'rgba(79, 70, 229, 0.1)', // Indigo 600 with opacity
    secondary: '#10B981',   // Emerald 500
    secondaryDark: '#059669', // Emerald 600
    background: '#F9FAFB',  // Gray 50
    surface: '#FFFFFF',     // White
    error: '#EF4444',       // Red 500
    warning: '#F59E0B',     // Amber 500
    warningFaded: 'rgba(245, 158, 11, 0.1)',
    success: '#10B981',     // Emerald 500
    successFaded: 'rgba(16, 185, 129, 0.1)',
    text: '#1F2937',        // Gray 800
    textSecondary: '#6B7280', // Gray 500
    textLight: '#9CA3AF',   // Gray 400
    border: '#E5E7EB',      // Gray 200
    divider: '#F3F4F6',     // Gray 100
    // Status badge backgrounds (keep RGBA for transparency)
    blueFaded: 'rgba(59, 130, 246, 0.15)',
    greenFaded: 'rgba(16, 185, 129, 0.15)',
    purpleFaded: 'rgba(139, 92, 246, 0.15)',
    grayFaded: 'rgba(107, 114, 128, 0.15)',
    yellowFaded: 'rgba(245, 158, 11, 0.15)',
    redFaded: 'rgba(239, 68, 68, 0.15)',
    // Card backgrounds
    cardBlue: '#EEF2FF',
    cardGreen: '#ECFDF5',
    cardYellow: '#FEF3C7',
    cardRed: '#FEE2E2',
};

// Item Categories
export const CATEGORIES = [
    { value: 'BAG', label: 'Bag/Backpack', icon: 'bag-personal' },
    { value: 'PHONE', label: 'Phone/Mobile Device', icon: 'cellphone' },
    { value: 'WALLET', label: 'Wallet/Purse', icon: 'wallet' },
    { value: 'KEYS', label: 'Keys', icon: 'key' },
    { value: 'LAPTOP', label: 'Laptop/Computer', icon: 'laptop' },
    { value: 'CLOTHING', label: 'Clothing', icon: 'tshirt-crew' },
    { value: 'JEWELRY', label: 'Jewelry/Watch', icon: 'watch' },
    { value: 'DOCUMENTS', label: 'Documents/ID', icon: 'file-document' },
    { value: 'ELECTRONICS', label: 'Electronics', icon: 'power-plug' },
    { value: 'GLASSES', label: 'Glasses/Sunglasses', icon: 'glasses' },
    { value: 'HEADPHONES', label: 'Headphones/Earbuds', icon: 'headphones' },
    { value: 'UMBRELLA', label: 'Umbrella', icon: 'umbrella' },
    { value: 'BOOKS', label: 'Books/Stationery', icon: 'book-open-variant' },
    { value: 'SPORTS', label: 'Sports Equipment', icon: 'soccer' },
    { value: 'OTHER', label: 'Other', icon: 'package-variant' },
];

// Status Labels with pre-computed faded backgrounds
export const STATUS_LABELS = {
    // Lost Item Statuses
    SEARCHING: { label: 'Searching', color: '#3B82F6', fadedBg: 'rgba(59, 130, 246, 0.15)' },
    MATCHED: { label: 'Matched', color: '#10B981', fadedBg: 'rgba(16, 185, 129, 0.15)' },
    CLAIMED: { label: 'Claimed', color: '#8B5CF6', fadedBg: 'rgba(139, 92, 246, 0.15)' },
    EXPIRED: { label: 'Expired', color: '#6B7280', fadedBg: 'rgba(107, 114, 128, 0.15)' },

    // Found Item Statuses
    AVAILABLE: { label: 'Available', color: '#10B981', fadedBg: 'rgba(16, 185, 129, 0.15)' },
    RETURNED: { label: 'Returned', color: '#8B5CF6', fadedBg: 'rgba(139, 92, 246, 0.15)' },

    // Claim Statuses
    PENDING: { label: 'Pending', color: '#F59E0B', fadedBg: 'rgba(245, 158, 11, 0.15)' },
    APPROVED: { label: 'Approved', color: '#10B981', fadedBg: 'rgba(16, 185, 129, 0.15)' },
    REJECTED: { label: 'Rejected', color: '#EF4444', fadedBg: 'rgba(239, 68, 68, 0.15)' },
    PROOF_REQUIRED: { label: 'Proof Required', color: '#F59E0B', fadedBg: 'rgba(245, 158, 11, 0.15)' },

    // Match Statuses
    POTENTIAL: { label: 'Potential', color: '#3B82F6', fadedBg: 'rgba(59, 130, 246, 0.15)' },
    VERIFIED: { label: 'Verified', color: '#10B981', fadedBg: 'rgba(16, 185, 129, 0.15)' },
};

// Default status for unknown values
export const DEFAULT_STATUS = { label: 'Unknown', color: '#6B7280', fadedBg: 'rgba(107, 114, 128, 0.15)' };

// Helper to get status info
export const getStatusInfo = (status) => STATUS_LABELS[status] || DEFAULT_STATUS;
