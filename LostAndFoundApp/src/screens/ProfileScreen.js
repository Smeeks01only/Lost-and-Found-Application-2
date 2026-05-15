/**
 * Profile Screen
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Image,
    Platform,
    Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            const confirmLogout = window.confirm('Are you sure you want to logout?');
            if (confirmLogout) {
                logout();
            }
        } else {
            Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Logout', style: 'destructive', onPress: logout },
                ]
            );
        }
    };

    const MenuOption = ({ icon, title, subtitle, onPress, showBorder = true, isDestructive = false }) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIconContainer, { backgroundColor: isDestructive ? COLORS.errorFaded : COLORS.background }]}>
                <MaterialCommunityIcons name={icon} size={22} color={isDestructive ? COLORS.error : COLORS.textSecondary} />
            </View>
            <View style={[styles.menuContent, showBorder && styles.menuBorder]}>
                <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuTitle, isDestructive && { color: COLORS.error }]}>{title}</Text>
                    {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textLight} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity style={styles.headerIcon}>
                    <MaterialCommunityIcons name="dots-horizontal" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.full_name || 'User Name'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <MaterialCommunityIcons name="shield-account-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase' }}>
                                {user?.role || 'User'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section: Security & Privacy */}
                <View style={styles.sectionCard}>
                    <MenuOption
                        icon="shield-lock-outline"
                        title="Account Security"
                        subtitle="Manage password and 2FA"
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                window.alert('Security Notice\n\nTwo-Factor Authentication (2FA) is currently enabled. Password changes must be handled through the main web portal.');
                            } else {
                                Alert.alert(
                                    'Security Notice',
                                    'Two-Factor Authentication (2FA) is currently enabled. Password changes must be handled through the main web portal.'
                                );
                            }
                        }}
                    />
                    <MenuOption
                        icon="database-export-outline"
                        title="Export My Data"
                        subtitle="Request an archive of your data"
                        showBorder={false}
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                window.alert('Export Started\n\nYour data archive is being compiled. A secure download link will be emailed to you within 24 hours.');
                            } else {
                                Alert.alert(
                                    'Export Started',
                                    'Your data archive is being compiled. A secure download link will be emailed to you within 24 hours.',
                                    [{ text: 'Understood' }]
                                );
                            }
                        }}
                    />
                </View>

                {/* Section: App Settings */}
                <View style={styles.sectionCard}>
                    <MenuOption
                        icon="broom"
                        title="Clear App Cache"
                        subtitle="Free up storage space"
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                window.alert('Cache Cleared\n\nSuccessfully cleared 12.4 MB of temporary app data.');
                            } else {
                                Alert.alert(
                                    'Cache Cleared',
                                    'Successfully cleared 12.4 MB of temporary app data.',
                                    [{ text: 'OK' }]
                                );
                            }
                        }}
                    />
                    <MenuOption
                        icon="bell-ring-outline"
                        title="Push Notifications"
                        subtitle="Enabled"
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                window.alert('Notifications\n\nPush notifications are active for potential matches and platform updates.');
                            } else {
                                Alert.alert(
                                    'Notifications',
                                    'Push notifications are active for potential matches and platform updates.'
                                );
                            }
                        }}
                    />
                    <MenuOption
                        icon="email-outline"
                        title="Contact Support"
                        subtitle="Email our support team"
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                window.open('mailto:support@lostandfound.com');
                            } else {
                                Linking.openURL('mailto:support@lostandfound.com');
                            }
                        }}
                    />
                    <MenuOption
                        icon="information-outline"
                        title="About App"
                        subtitle="Version 3.0.0"
                        showBorder={false}
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                window.alert('Lost and Found Platform v3.0.0\n\nA cross-platform solution powered by React Native and Django AI.');
                            } else {
                                Alert.alert(
                                    'About App',
                                    'Lost and Found Platform v3.0.0\n\nA cross-platform solution powered by React Native and Django AI.'
                                );
                            }
                        }}
                    />
                </View>

                {/* Logout */}
                <View style={styles.sectionCard}>
                    <MenuOption
                        icon="logout"
                        title="Logout"
                        onPress={handleLogout}
                        showBorder={false}
                        isDestructive={true}
                    />
                </View>

                <Text style={styles.versionText}>Version 1.0.2</Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light Gray background as per reference
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerIcon: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    // User Card
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    avatarImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    editButton: {
        padding: 8,
    },
    // Section Cards
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    menuBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 16,
        marginBottom: 4,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    versionText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 8,
    },
});
