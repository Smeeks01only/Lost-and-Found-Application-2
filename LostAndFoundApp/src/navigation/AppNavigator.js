/**
 * App Navigation Configuration
 * Role-based navigation for LOSER, STAFF, and ADMIN users
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Item Screens
import LostItemsScreen from '../screens/items/LostItemsScreen';
import ReportLostItemScreen from '../screens/items/ReportLostItemScreen';

// Match Screens
import MatchesScreen from '../screens/matches/MatchesScreen';
import SubmitClaimScreen from '../screens/matches/SubmitClaimScreen';

// Staff Screens
import FoundItemsScreen from '../screens/staff/FoundItemsScreen';
import ClaimsReviewScreen from '../screens/staff/ClaimsReviewScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Bar Icon Component
const TabIcon = ({ icon, focused, color }) => (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
);

// LOSER Tabs - Regular users who report lost items
function LoserTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: true,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="home-outline" focused={focused} color={color} />,
                    tabBarActiveIcon: ({ focused, color }) => <TabIcon icon="home" focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="Items"
                component={LostItemsScreen}
                options={{
                    tabBarLabel: 'My Items',
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="bag-personal-outline" focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="Matches"
                component={MatchesScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="magnify-scan" focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="account-circle-outline" focused={focused} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

// STAFF Tabs - Office staff who manage found items
function StaffTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: true,
                tabBarActiveTintColor: COLORS.secondary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="home-outline" focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="FoundItems"
                component={FoundItemsScreen}
                options={{
                    tabBarLabel: 'Found Items',
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="bag-checked" focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="Claims"
                component={ClaimsReviewScreen}
                options={{
                    tabBarLabel: 'Claims',
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="clipboard-check-outline" focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="account-circle-outline" focused={focused} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

// ADMIN Tabs - Administrators with full access
function AdminTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: true,
                tabBarActiveTintColor: COLORS.error,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={AdminDashboardScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="view-dashboard-outline" focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="FoundItems"
                component={FoundItemsScreen}
                options={{
                    tabBarLabel: 'Found Items',
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="bag-checked" focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="Claims"
                component={ClaimsReviewScreen}
                options={{
                    tabBarLabel: 'Claims',
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="clipboard-text-outline" focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => <TabIcon icon="account-circle-outline" focused={focused} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

// Get the appropriate tabs based on user role
function getRoleTabs(role) {
    switch (role) {
        case 'STAFF':
            return StaffTabs;
        case 'ADMIN':
            return AdminTabs;
        case 'LOSER':
        default:
            return LoserTabs;
    }
}

// Auth Stack Navigator
function AuthStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

// Main Stack Navigator - Role-based
function MainStack({ userRole }) {
    const RoleTabs = getRoleTabs(userRole);

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: COLORS.surface },
                headerTintColor: COLORS.text,
                headerTitleStyle: { fontWeight: '600' },
            }}
        >
            <Stack.Screen
                name="MainTabs"
                component={RoleTabs}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ReportLostItem"
                component={ReportLostItemScreen}
                options={{ title: 'Report Lost Item' }}
            />
            <Stack.Screen
                name="SubmitClaim"
                component={SubmitClaimScreen}
                options={{ title: 'Submit Claim' }}
            />
            {/* Staff/Admin can navigate to these screens from anywhere */}
            <Stack.Screen
                name="ClaimsReview"
                component={ClaimsReviewScreen}
                options={{ title: 'Review Claims' }}
            />
        </Stack.Navigator>
    );
}

// Root Navigator
export default function AppNavigator() {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? (
                <MainStack userRole={user?.role || 'LOSER'} />
            ) : (
                <AuthStack />
            )}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    tabBar: {
        height: 70,
        paddingBottom: 10,
        paddingTop: 8,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    tabIcon: {
        padding: 4,
    },
    tabIconFocused: {
        // Simplified - removed transform which can cause Android issues
    },
});
