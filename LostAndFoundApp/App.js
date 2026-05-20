/**
 * Lost and Found Platform - Mobile App Entry Point
 */

import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { AlertProvider } from "./src/context/AlertContext";
import AppNavigator from "./src/navigation/AppNavigator";
import CustomAlert from "./src/components/CustomAlert";
import { nlpAPI } from "./src/api";

export default function App() {
  useEffect(() => {
    // Warm up the backend NLP model so matching is fast.
    // Do not block app startup if the backend isn't reachable.
    nlpAPI.warmup().catch(() => {});
  }, []);

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
