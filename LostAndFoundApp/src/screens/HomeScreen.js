/**
 * Home Screen - Dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { itemsAPI, matchesAPI, notificationsAPI } from '../api';
import { COLORS, STATUS_LABELS } from '../constants';

export default function HomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        lostItems: 0,
        matches: 0,
        claims: 0,
        unreadNotifications: 0,
    });
    const [recentItems, setRecentItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboardData = async () => {
        try {
            const [lostItemsRes, matchesRes, claimsRes, notifRes] = await Promise.all([
                itemsAPI.getLostItems(),
                matchesAPI.getMatches(),
                matchesAPI.getClaims(),
                notificationsAPI.getUnreadCount(),
            ]);

            setStats({
                lostItems: lostItemsRes.results?.length || lostItemsRes.length || 0,
                matches: matchesRes.results?.length || matchesRes.length || 0,
                claims: claimsRes.results?.length || claimsRes.length || 0,
                unreadNotifications: notifRes.unread_count || 0,
            });

            // Get recent items
            const items = lostItemsRes.results || lostItemsRes || [];
            setRecentItems(items.slice(0, 3));
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
                    {user?.role && user.role !== 'LOSER' && (
                        <View style={[styles.roleBadge, user.role === 'ADMIN' ? styles.adminBadge : styles.staffBadge]}>
                            <Text style={styles.roleBadgeText}>{user.role}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
                    <MaterialCommunityIcons name="account" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <TouchableOpacity
                    style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}
                    onPress={() => navigation.navigate('Items')}
                >
                    <Text style={styles.statNumber}>{stats.lostItems}</Text>
                    <Text style={styles.statLabel}>Lost Items</Text>
                    <MaterialCommunityIcons name="bag-personal-outline" size={24} color={COLORS.textSecondary} style={styles.statIcon} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}
                    onPress={() => navigation.navigate('Matches')}
                >
                    <Text style={styles.statNumber}>{stats.matches}</Text>
                    <Text style={styles.statLabel}>Matches</Text>
                    <MaterialCommunityIcons name="magnify-scan" size={24} color={COLORS.textSecondary} style={styles.statIcon} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}
                    onPress={() => navigation.navigate('Matches', { tab: 'claims' })}
                >
                    <Text style={styles.statNumber}>{stats.claims}</Text>
                    <Text style={styles.statLabel}>Claims</Text>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={24} color={COLORS.textSecondary} style={styles.statIcon} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Text style={styles.statNumber}>{stats.unreadNotifications}</Text>
                    <Text style={styles.statLabel}>Notifications</Text>
                    <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.textSecondary} style={styles.statIcon} />
                </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ReportLostItem')}
                >
                    <View style={styles.actionIconContainer}>
                        <MaterialCommunityIcons name="plus" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Report Lost Item</Text>
                        <Text style={styles.actionSubtitle}>Let us help you find it</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Matches')}
                >
                    <View style={styles.actionIconContainer}>
                        <MaterialCommunityIcons name="magnify" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Browse Found Items</Text>
                        <Text style={styles.actionSubtitle}>See items that match yours</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Recent Items */}
            {recentItems.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Your Recent Items</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Items')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {recentItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.itemCard}
                            onPress={() => navigation.navigate('ItemDetail', { id: item.id })}
                        >
                            <View style={styles.itemIconContainer}>
                                <MaterialCommunityIcons name="bag-personal" size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <Text style={styles.itemLocation}>{item.location_lost}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: STATUS_LABELS[item.status]?.fadedBg || 'rgba(107, 114, 128, 0.15)' }]}>
                                <Text style={[styles.statusText, { color: STATUS_LABELS[item.status]?.color || '#6B7280' }]}>
                                    {STATUS_LABELS[item.status]?.label || item.status}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileIcon: {
        fontSize: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        marginTop: -20,
    },
    statCard: {
        width: '47%',
        margin: '1.5%',
        padding: 16,
        borderRadius: 16,
        position: 'relative',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    statIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
        fontSize: 24,
        opacity: 0.6,
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    seeAll: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    actionSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    actionArrow: {
        fontSize: 18,
        color: COLORS.textSecondary,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    itemIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
    },
    itemLocation: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    staffBadge: {
        backgroundColor: COLORS.secondaryFaded || 'rgba(59, 130, 246, 0.15)',
    },
    adminBadge: {
        backgroundColor: COLORS.errorFaded || 'rgba(239, 68, 68, 0.15)',
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.text,
    },
});
