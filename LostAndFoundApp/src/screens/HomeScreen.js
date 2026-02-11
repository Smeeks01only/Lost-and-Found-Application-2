/**
 * Home Screen - Dashboard
 * UI Pattern: Clean Dashboard (Matches My Items & Matches Tabs)
 */

import React, { useState, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        activeItems: 0,
        potentialMatches: 0,
        unreadNotifications: 0,
    });
    const [recentItems, setRecentItems] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboardData = async () => {
        try {
            if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
                // Load Staff Data
                const [foundItemsRes, matchesRes, claimsRes] = await Promise.all([
                    itemsAPI.getFoundItems(), // Assuming this exists
                    matchesAPI.getMatches(), // Maybe all matches?
                    // claimsAPI.getClaims() // Assuming this exists
                ]);

                const foundItems = foundItemsRes.results || foundItemsRes || [];
                // For now, just use found items for stats
                setStats({
                    activeItems: foundItems.length,
                    potentialMatches: 0, // Staff check matches in detail view
                    unreadNotifications: 0,
                });
                setRecentItems(foundItems.slice(0, 5));
                setRecentMatches([]);

            } else {
                // Load User Data (Existing logic)
                const [lostItemsRes, matchesRes, notifRes] = await Promise.all([
                    itemsAPI.getLostItems(),
                    matchesAPI.getMatches(),
                    notificationsAPI.getUnreadCount(),
                ]);

                const myItems = lostItemsRes.results || lostItemsRes || [];
                const myMatches = matchesRes.results || matchesRes || [];

                setStats({
                    activeItems: myItems.filter(i => i.status === 'SEARCHING').length,
                    potentialMatches: myMatches.filter(m => m.status === 'POTENTIAL').length,
                    unreadNotifications: notifRes.unread_count || 0,
                });

                setRecentItems(myItems.slice(0, 3));
                setRecentMatches(myMatches.slice(0, 5));
            }
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
        }, [user?.role]) // Add user.role dependency
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown Date';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderStaffDashboard = () => (
        <>
            {/* Staff Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Staff Portal</Text>
                    <Text style={styles.userName}>{user?.full_name || 'Staff Member'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <View style={[styles.profileIconContainer, { borderColor: COLORS.secondary }]}>
                        <MaterialCommunityIcons name="shield-account" size={24} color={COLORS.secondary} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Main Action: Register Found Item */}
            <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: COLORS.secondary }]}
                onPress={() => navigation.navigate('FoundItems')} // Navigate to Found Items tab/stack
                activeOpacity={0.9}
            >
                <View style={styles.actionCardContent}>
                    <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitle}>Register Found Item</Text>
                        <Text style={styles.actionSubtitle}>Log a new item into the system</Text>
                    </View>
                    <View style={styles.actionIcon}>
                        <MaterialCommunityIcons name="text-box-plus-outline" size={32} color="#fff" />
                    </View>
                </View>
            </TouchableOpacity>

            {/* Staff Stats */}
            <View style={styles.statsGrid}>
                <StatCard
                    title="Total Found"
                    value={stats.activeItems} // Using activeItems as total found for simplicity
                    icon="bag-checked"
                    color={COLORS.secondary}
                    onPress={() => navigation.navigate('FoundItems')}
                />
                <StatCard
                    title="Pending Claims"
                    value="-" // Placeholder
                    icon="clipboard-check-outline"
                    color={COLORS.warning}
                    onPress={() => { }}
                />
                <StatCard
                    title="System Status"
                    value="Online"
                    icon="server-network"
                    color={COLORS.success}
                    onPress={() => { }}
                />
            </View>

            {/* Recent Found Items List */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Registry</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('FoundItems')}>
                        <Text style={[styles.seeAll, { color: COLORS.secondary }]}>View Registry</Text>
                    </TouchableOpacity>
                </View>

                {recentItems.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={COLORS.textLight} />
                        <Text style={styles.emptyStateTitle}>No items logged</Text>
                        <Text style={styles.emptyStateText}>Recent found items will appear here.</Text>
                    </View>
                ) : (
                    recentItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.itemCard}
                            onPress={() => navigation.navigate('ItemDetail', { id: item.id, type: 'FOUND' })} // Assuming ItemDetail handles found items or distinct screen needed
                            activeOpacity={0.8}
                        >
                            <View style={[styles.itemIconContainer, { backgroundColor: COLORS.successFaded }]}>
                                <MaterialCommunityIcons
                                    name={item.category_icon || 'bag-checked'}
                                    size={24}
                                    color={COLORS.success} // Green for Found
                                />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.itemLocation} numberOfLines={1}>
                                    {item.location_found || 'Unknown Location'} • {formatDate(item.date_found)}
                                </Text>
                            </View>
                            <View style={[styles.statusPill, { backgroundColor: COLORS.grayFaded }]}>
                                <Text style={[styles.statusText, { color: COLORS.textSecondary }]}>
                                    {item.status}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </>
    );

    const renderLoserDashboard = () => (
        <>
            {/* Welcome Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'User'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <View style={styles.profileIconContainer}>
                        <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Main Action Card */}
            <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('ReportLostItem')}
                activeOpacity={0.9}
            >
                <View style={styles.actionCardContent}>
                    <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitle}>Lost something?</Text>
                        <Text style={styles.actionSubtitle}>Report it now to find a match</Text>
                    </View>
                    <View style={styles.actionIcon}>
                        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
                    </View>
                </View>
            </TouchableOpacity>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatCard
                    title="Active Items"
                    value={stats.activeItems}
                    icon="bag-personal"
                    color={COLORS.primary}
                    onPress={() => navigation.navigate('Items')}
                />
                <StatCard
                    title="Matches"
                    value={stats.potentialMatches}
                    icon="magnify-scan"
                    color={COLORS.secondary}
                    onPress={() => navigation.navigate('Matches')}
                />
                <StatCard
                    title="Alerts"
                    value={stats.unreadNotifications}
                    icon="bell-outline"
                    color={COLORS.warning}
                    onPress={() => navigation.navigate('Notifications')}
                />
            </View>

            {/* Potential Matches (Horizontal Scroll) */}
            {recentMatches.length > 0 && (
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Potential Matches</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Matches')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.matchesScroll}
                    >
                        {recentMatches.map((match) => (
                            <TouchableOpacity
                                key={match.id}
                                style={styles.matchCard}
                                onPress={() => navigation.navigate('MatchDetail', { id: match.id })}
                                activeOpacity={0.8}
                            >
                                <View style={styles.matchHeader}>
                                    <View style={[styles.scoreBadge, { backgroundColor: COLORS.success + '15' }]}>
                                        <MaterialCommunityIcons name="star-four-points" size={12} color={COLORS.success} />
                                        <Text style={[styles.scoreText, { color: COLORS.success, marginLeft: 4 }]}>
                                            {(match.final_score * 100).toFixed(0)}% Match
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.matchContent}>
                                    <Text style={styles.matchTitle} numberOfLines={1}>
                                        {match.found_item_title || 'Unknown Item'}
                                    </Text>

                                    <View style={styles.matchMeta}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.textSecondary} />
                                        <Text style={styles.matchMetaText} numberOfLines={1}>
                                            {match.found_item_location || 'No location'}
                                        </Text>
                                    </View>

                                    <View style={styles.matchMeta}>
                                        <MaterialCommunityIcons name="calendar-clock" size={14} color={COLORS.textSecondary} />
                                        <Text style={styles.matchMetaText} numberOfLines={1}>
                                            {formatDate(match.created_at)}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Recent Items List (Vertical) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Items</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Items')}>
                        <Text style={styles.seeAll}>View All</Text>
                    </TouchableOpacity>
                </View>

                {recentItems.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="check-circle-outline" size={48} color={COLORS.success} />
                        <Text style={styles.emptyStateTitle}>All good!</Text>
                        <Text style={styles.emptyStateText}>No active lost items.</Text>
                    </View>
                ) : (
                    recentItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.itemCard}
                            onPress={() => navigation.navigate('ItemDetail', { id: item.id, type: 'LOST' })}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.itemIconContainer, { backgroundColor: COLORS.primaryFaded }]}>
                                <MaterialCommunityIcons
                                    name={item.category_icon || 'bag-personal'}
                                    size={24}
                                    color={COLORS.primary}
                                />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.itemLocation} numberOfLines={1}>
                                    {item.location_lost} • {formatDate(item.date_lost)}
                                </Text>
                            </View>
                            <View style={[
                                styles.statusPill,
                                { backgroundColor: STATUS_LABELS[item.status]?.color + '20' || COLORS.grayFaded }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: STATUS_LABELS[item.status]?.color || COLORS.textSecondary }
                                ]}>
                                    {STATUS_LABELS[item.status]?.label || item.status}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {(user?.role === 'STAFF' || user?.role === 'ADMIN') ? renderStaffDashboard() : renderLoserDashboard()}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// Helper Components
const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity
        style={styles.statCard}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.statHeader}>
            <View style={[styles.statIconBox, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
        </View>
        <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    userName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    profileButton: {
        padding: 4,
    },
    profileIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    // Action Card
    actionCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        marginBottom: 28,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    actionCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    actionSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        width: '31%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 14,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    statIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statTitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    // Sections
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    seeAll: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    // Matches Scroll
    matchesScroll: {
        paddingRight: 20,
        paddingBottom: 20, // Add padding to bottom to prevent shadow clipping
    },
    matchCard: {
        width: 200, // Increased width for better content display
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginRight: 16,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    matchHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    scoreText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    matchContent: {
        gap: 6,
    },
    matchTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    matchMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    matchMetaText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 6,
    },
    // Recent Items List
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    itemIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemLocation: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    emptyStateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 12,
        marginBottom: 4,
    },
    emptyStateText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});
