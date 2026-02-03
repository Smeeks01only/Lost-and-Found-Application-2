/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user on app start
    useEffect(() => {
        loadStoredUser();
    }, []);

    const loadStoredUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const accessToken = await AsyncStorage.getItem('accessToken');

            if (storedUser && accessToken) {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const data = await authAPI.login(email, password);

            // Store tokens
            await AsyncStorage.setItem('accessToken', data.access);
            await AsyncStorage.setItem('refreshToken', data.refresh);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));

            setUser(data.user);
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.detail || 'Invalid credentials';
            return { success: false, error: message };
        }
    };

    const register = async (userData) => {
        try {
            const data = await authAPI.register(userData);
            return { success: true, data };
        } catch (error) {
            const errors = error.response?.data || { error: 'Registration failed' };
            return { success: false, errors };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.log('Logout API error (ignored):', error);
        }

        // Clear storage
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateProfile = async (profileData) => {
        try {
            const data = await authAPI.updateProfile(profileData);
            const updatedUser = { ...user, ...data.user };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data };
        }
    };

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
