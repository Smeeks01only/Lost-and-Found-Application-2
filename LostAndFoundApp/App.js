/**
 * Lost and Found Platform - Mobile App Entry Point
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';
import CustomAlert from './src/components/CustomAlert';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AlertProvider>
          <StatusBar style="auto" />
          <AppNavigator />
          <CustomAlert />
        </AlertProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
