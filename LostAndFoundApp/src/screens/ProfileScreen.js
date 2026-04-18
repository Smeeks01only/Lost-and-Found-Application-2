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
                    </View>
                    <TouchableOpacity style={styles.editButton}>
                        <MaterialCommunityIcons name="pencil-outline" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Section 1: Dashboard */}
                <View style={styles.sectionCard}>
                    <MenuOption
                        icon="file-document-outline"
                        title="My Reports"
                        subtitle="View lost items you reported"
                        onPress={() => navigation.navigate('MyLostItems')}
                    />
                    <MenuOption
                        icon="hand-heart-outline"
                        title="My Finds"
                        subtitle="Items you have found"
                        onPress={() => navigation.navigate('MyFoundItems')}
                    />
                    <MenuOption
                        icon="star-outline"
                        title="Matches"
                        subtitle="Potential matches for your items"
                        onPress={() => navigation.navigate('Matches')}
                        showBorder={false}
                    />
                </View>

                {/* Section 2: Account Settings */}
                <View style={styles.sectionCard}>
                    <MenuOption
                        icon="account-cog-outline"
                        title="Edit Profile"
                    />
                    <MenuOption
                        icon="bell-outline"
                        title="Notifications"
                    />
                    <MenuOption
                        icon="translate"
                        title="Language"
                        subtitle="English"
                        showBorder={false}
                    />
                </View>

                {/* Section 3: Support */}
                <View style={styles.sectionCard}>
                    <MenuOption
                        icon="help-circle-outline"
                        title="Get Help"
                    />
                    <MenuOption
                        icon="shield-check-outline"
                        title="Privacy Policy"
                    />
                    <MenuOption
                        icon="file-document-outline"
                        title="Terms & Conditions"
                        showBorder={false}
                    />
                </View>

                {/* Logout */}
                <View style={styles.sectionCard}>
                    <MenuOption
                        icon="logout"
                        title="Log Out"
                        isDestructive={true}
                        onPress={handleLogout}
                        showBorder={false}
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
