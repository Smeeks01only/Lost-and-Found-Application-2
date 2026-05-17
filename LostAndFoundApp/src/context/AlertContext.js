/**
 * Global Alert Context
 * Provides a professional custom alert dialog throughout the app.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        type: 'info', // 'success' | 'error' | 'warning' | 'info' | 'confirm'
        title: '',
        message: '',
        buttons: [],
    });

    const showAlert = useCallback(({ type = 'info', title, message, buttons }) => {
        setAlertConfig({
            visible: true,
            type,
            title,
            message,
            buttons: buttons || [{ text: 'OK' }],
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ alertConfig, showAlert, hideAlert }}>
            {children}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
