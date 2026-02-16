/**
 * User Management Screen (Admin Only)
 * Lists all users with stats, search, role filter, and management actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI } from '../../api';
import { COLORS } from '../../constants';

const ROLE_CONFIG = {
    LOSER: { label: 'User', color: '#3B82F6', icon: 'account' },
    STAFF: { label: 'Staff', color: '#10B981', icon: 'shield-account' },
    ADMIN: { label: 'Admin', color: '#EF4444', icon: 'shield-crown' },
};

export default function UserManagementScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [updating, setUpdating] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (roleFilter) params.role = roleFilter;

            const [usersRes, statsRes] = await Promise.all([
                authAPI.getUsers(params),
                authAPI.getUserStats(),
            ]);

            setUsers(usersRes.results || usersRes || []);
            setStats(statsRes);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery, roleFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleUpdateRole = async (userId, newRole) => {
        setUpdating(true);
        try {
            await authAPI.updateUser(userId, { role: newRole });
            Alert.alert('Success', 'User role updated.');
            setModalVisible(false);
            setSelectedUser(null);
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to update user role.');
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleActive = async (userId, currentStatus) => {
        Alert.alert(
            currentStatus ? 'Deactivate User' : 'Activate User',
            `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: currentStatus ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            await authAPI.updateUser(userId, { is_active: !currentStatus });
                            Alert.alert('Success', `User ${currentStatus ? 'deactivated' : 'activated'}.`);
                            setModalVisible(false);
                            setSelectedUser(null);
                            loadData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update user status.');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // ==================== Sub-Components ====================

    const StatsRow = () => {
        if (!stats) return null;
        return (
            <View style={styles.statsRow}>
                <View style={[styles.miniStatCard, { borderLeftColor: COLORS.primary }]}>
                    <Text style={styles.miniStatValue}>{stats.total_users}</Text>
                    <Text style={styles.miniStatLabel}>Total</Text>
                </View>
                <View style={[styles.miniStatCard, { borderLeftColor: '#3B82F6' }]}>
                    <Text style={styles.miniStatValue}>{stats.by_role?.LOSER || 0}</Text>
                    <Text style={styles.miniStatLabel}>Users</Text>
                </View>
                <View style={[styles.miniStatCard, { borderLeftColor: '#10B981' }]}>
                    <Text style={styles.miniStatValue}>{stats.by_role?.STAFF || 0}</Text>
                    <Text style={styles.miniStatLabel}>Staff</Text>
                </View>
                <View style={[styles.miniStatCard, { borderLeftColor: '#EF4444' }]}>
                    <Text style={styles.miniStatValue}>{stats.by_role?.ADMIN || 0}</Text>
                    <Text style={styles.miniStatLabel}>Admins</Text>
                </View>
            </View>
        );
    };

    const FilterChips = () => (
        <View style={styles.filterRow}>
            <TouchableOpacity
                style={[styles.chip, !roleFilter && styles.chipActive]}
                onPress={() => setRoleFilter(null)}
            >
                <Text style={[styles.chipText, !roleFilter && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                <TouchableOpacity
                    key={role}
                    style={[styles.chip, roleFilter === role && { backgroundColor: config.color + '20', borderColor: config.color }]}
                    onPress={() => setRoleFilter(roleFilter === role ? null : role)}
                >
                    <Text style={[styles.chipText, roleFilter === role && { color: config.color }]}>{config.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const UserCard = ({ item }) => {
        const roleConfig = ROLE_CONFIG[item.role] || ROLE_CONFIG.LOSER;
        return (
            <TouchableOpacity
                style={styles.userCard}
                onPress={() => { setSelectedUser(item); setModalVisible(true); }}
                activeOpacity={0.7}
            >
                <View style={[styles.avatarCircle, { backgroundColor: roleConfig.color + '20' }]}>
                    <Text style={[styles.avatarText, { color: roleConfig.color }]}>
                        {item.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userNameText} numberOfLines={1}>{item.full_name || 'Unnamed'}</Text>
                    <Text style={styles.userEmailText} numberOfLines={1}>{item.email}</Text>
                </View>

                <View style={styles.userMeta}>
                    <View style={[styles.roleBadge, { backgroundColor: roleConfig.color + '15' }]}>
                        <Text style={[styles.roleBadgeText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
                    </View>
                    {!item.is_active && (
                        <View style={[styles.roleBadge, { backgroundColor: COLORS.redFaded, marginTop: 4 }]}>
                            <Text style={[styles.roleBadgeText, { color: COLORS.error }]}>Inactive</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const UserDetailModal = () => {
        if (!selectedUser) return null;
        const roleConfig = ROLE_CONFIG[selectedUser.role] || ROLE_CONFIG.LOSER;

        return (
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>User Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* User Info */}
                        <View style={styles.modalUserSection}>
                            <View style={[styles.modalAvatar, { backgroundColor: roleConfig.color + '20' }]}>
                                <Text style={[styles.modalAvatarText, { color: roleConfig.color }]}>
                                    {selectedUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>
                            <Text style={styles.modalUserName}>{selectedUser.full_name || 'Unnamed'}</Text>
                            <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: roleConfig.color + '15', marginTop: 8 }]}>
                                <Text style={[styles.roleBadgeText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
                            </View>
                        </View>

                        {/* Details */}
                        <View style={styles.modalDetailRow}>
                            <Text style={styles.modalDetailLabel}>Phone</Text>
                            <Text style={styles.modalDetailValue}>{selectedUser.phone_number || 'Not set'}</Text>
                        </View>
                        <View style={styles.modalDetailRow}>
                            <Text style={styles.modalDetailLabel}>Joined</Text>
                            <Text style={styles.modalDetailValue}>{formatDate(selectedUser.date_joined)}</Text>
                        </View>
                        <View style={styles.modalDetailRow}>
                            <Text style={styles.modalDetailLabel}>Status</Text>
                            <Text style={[styles.modalDetailValue, { color: selectedUser.is_active ? COLORS.success : COLORS.error }]}>
                                {selectedUser.is_active ? 'Active' : 'Inactive'}
                            </Text>
                        </View>

                        {/* Actions */}
                        <Text style={styles.modalSectionTitle}>Change Role</Text>
                        <View style={styles.roleButtonsRow}>
                            {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.roleButton,
                                        selectedUser.role === role && { backgroundColor: config.color, borderColor: config.color },
                                    ]}
                                    onPress={() => selectedUser.role !== role && handleUpdateRole(selectedUser.id, role)}
                                    disabled={updating || selectedUser.role === role}
                                >
                                    <MaterialCommunityIcons
                                        name={config.icon}
                                        size={16}
                                        color={selectedUser.role === role ? '#fff' : config.color}
                                    />
                                    <Text style={[
                                        styles.roleButtonText,
                                        selectedUser.role === role && { color: '#fff' },
                                        selectedUser.role !== role && { color: config.color },
                                    ]}>
                                        {config.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.toggleButton, { backgroundColor: selectedUser.is_active ? COLORS.redFaded : COLORS.successFaded }]}
                            onPress={() => handleToggleActive(selectedUser.id, selectedUser.is_active)}
                        >
                            <MaterialCommunityIcons
                                name={selectedUser.is_active ? 'account-off' : 'account-check'}
                                size={20}
                                color={selectedUser.is_active ? COLORS.error : COLORS.success}
                            />
                            <Text style={[styles.toggleButtonText, { color: selectedUser.is_active ? COLORS.error : COLORS.success }]}>
                                {selectedUser.is_active ? 'Deactivate Account' : 'Activate Account'}
                            </Text>
                        </TouchableOpacity>

                        {updating && <ActivityIndicator style={{ marginTop: 12 }} color={COLORS.primary} />}
                    </View>
                </View>
            </Modal>
        );
    };

    // ==================== Main Render ====================

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Users</Text>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{stats?.total_users || 0}</Text>
                </View>
            </View>

            {/* Stats */}
            <StatsRow />

            {/* Search */}
            <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or email..."
                    placeholderTextColor={COLORS.textLight}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={loadData}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); }}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textLight} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips */}
            <FilterChips />

            {/* User List */}
            <FlatList
                data={users}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <UserCard item={item} />}
                contentContainerStyle={users.length === 0 ? styles.emptyListContainer : styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="account-search" size={48} color={COLORS.textLight} />
                        <Text style={styles.emptyStateTitle}>No users found</Text>
                        <Text style={styles.emptyStateText}>Try adjusting your search or filters.</Text>
                    </View>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            />

            {/* User Detail Modal */}
            <UserDetailModal />
        </SafeAreaView>
    );
}

// ==================== Styles ====================

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
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        flex: 1,
    },
    headerBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    headerBadgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    // Stats Row
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    miniStatCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        padding: 10,
        borderLeftWidth: 3,
        alignItems: 'center',
    },
    miniStatValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    miniStatLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: COLORS.text,
    },
    // Filter Chips
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    chipActive: {
        backgroundColor: COLORS.primary + '15',
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    chipTextActive: {
        color: COLORS.primary,
    },
    // User Card
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userNameText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    userEmailText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    userMeta: {
        alignItems: 'flex-end',
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
    emptyStateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 12,
    },
    emptyStateText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalUserSection: {
        alignItems: 'center',
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        marginBottom: 16,
    },
    modalAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalAvatarText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    modalUserName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    modalUserEmail: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    modalDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    modalDetailLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    modalDetailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    modalSectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 10,
    },
    roleButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    roleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        gap: 6,
    },
    roleButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    toggleButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
