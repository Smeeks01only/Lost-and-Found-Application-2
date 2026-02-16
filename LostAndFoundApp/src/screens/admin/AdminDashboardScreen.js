/**
 * Admin Dashboard Screen
 * System overview and management for administrators
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { itemsAPI, matchesAPI, authAPI } from '../../api';
import { COLORS } from '../../constants';
// import { useTheme } from '../../context/ThemeContext'; // Removed

export default function AdminDashboardScreen({ navigation }) {
    // const { theme } = useTheme(); // Removed
    const [stats, setStats] = useState({
        totalLostItems: 0,
        totalFoundItems: 0,
        pendingClaims: 0,
        totalMatches: 0,
        totalUsers: 0,
        recentSignups: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadDashboardData = useCallback(async () => {
        try {
            // Load stats from various endpoints
            const [lostItems, foundItems, claims, matches, userStats] = await Promise.all([
                itemsAPI.getLostItems().catch(() => ({ results: [] })),
                itemsAPI.getFoundItems().catch(() => ({ results: [] })),
                matchesAPI.getPendingClaims().catch(() => ({ results: [] })),
                matchesAPI.getMatches().catch(() => ({ results: [] })),
                authAPI.getUserStats().catch(() => ({ total_users: 0 })),
            ]);

            setStats({
                totalLostItems: lostItems.results?.length || lostItems.count || 0,
                totalFoundItems: foundItems.results?.length || foundItems.count || 0,
                pendingClaims: claims.results?.length || claims.length || 0,
                totalMatches: matches.results?.length || matches.count || 0,
                totalUsers: userStats.total_users || 0,
                recentSignups: userStats.recent_signups || 0,
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const onRefresh = () => {
        setIsRefreshing(true);
        loadDashboardData();
    };

    const StatCard = ({ icon, title, value, color, onPress }) => (
        <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: color }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <MaterialCommunityIcons name={icon} size={28} color={color} style={styles.statIcon} />
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </TouchableOpacity>
    );

    const ActionCard = ({ icon, title, subtitle, onPress }) => (
        <TouchableOpacity style={styles.actionCard} onPress={onPress}>
            <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} style={styles.actionIcon} />
            <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{title}</Text>
                <Text style={styles.actionSubtitle}>{subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {/* Stats Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>System Overview</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon="bag-personal-outline"
                            title="Lost Items"
                            value={stats.totalLostItems}
                            color={COLORS.primary}
                            onPress={() => navigation.navigate('AllLostItems')}
                        />
                        <StatCard
                            icon="package-variant-closed"
                            title="Found Items"
                            value={stats.totalFoundItems}
                            color={COLORS.success}
                            onPress={() => navigation.navigate('FoundItems')}
                        />
                        <StatCard
                            icon="magnify-scan"
                            title="Matches"
                            value={stats.totalMatches}
                            color="#8B5CF6"
                            onPress={() => navigation.navigate('AllMatches')}
                        />
                        <StatCard
                            icon="file-document-outline"
                            title="Pending Claims"
                            value={stats.pendingClaims}
                            color={COLORS.warning}
                            onPress={() => navigation.navigate('Claims')}
                        />
                        <StatCard
                            icon="account-group"
                            title="Total Users"
                            value={stats.totalUsers}
                            color="#6366F1"
                            onPress={() => navigation.navigate('UserManagement')}
                        />
                        <StatCard
                            icon="account-plus"
                            title="New This Week"
                            value={stats.recentSignups}
                            color="#EC4899"
                            onPress={() => navigation.navigate('UserManagement')}
                        />
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <ActionCard
                        icon="account-cog"
                        title="Manage Users"
                        subtitle="View, search, and manage all users"
                        onPress={() => navigation.navigate('UserManagement')}
                    />
                    <ActionCard
                        icon="clipboard-check-outline"
                        title="Review Claims"
                        subtitle="Process pending ownership claims"
                        onPress={() => navigation.navigate('ClaimsReview')}
                    />
                    <ActionCard
                        icon="package-variant"
                        title="Manage Found Items"
                        subtitle="Add or update found items"
                        onPress={() => navigation.navigate('FoundItems')}
                    />
                    <ActionCard
                        icon="refresh"
                        title="Run Matching Algorithm"
                        subtitle="Trigger NLP-based item matching"
                        onPress={() => Alert.alert(
                            'Run Matching',
                            'This will trigger the matching algorithm for all items.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Run', onPress: () => Alert.alert('Success', 'Matching started') }
                            ]
                        )}
                    />
                </View>

                {/* System Status */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>System Status</Text>
                    <View style={styles.statusCard}>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>NLP Model</Text>
                            <View style={styles.statusIndicator}>
                                <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                                <Text style={styles.statusValue}>Active</Text>
                            </View>
                        </View>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Database</Text>
                            <View style={styles.statusIndicator}>
                                <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                                <Text style={styles.statusValue}>Connected</Text>
                            </View>
                        </View>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Background Tasks</Text>
                            <View style={styles.statusIndicator}>
                                <View style={[styles.statusDot, { backgroundColor: COLORS.warning }]} />
                                <Text style={styles.statusValue}>Celery Required</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    adminBadge: {
        backgroundColor: COLORS.error,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    adminBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        width: '47%',
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    statIcon: {
        marginRight: 12,
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statTitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    actionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    actionIcon: {
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
    statusCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    statusLabel: {
        fontSize: 14,
        color: COLORS.text,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusValue: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});
