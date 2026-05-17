/**
 * Notifications Screen
 * Displays user notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationsAPI } from '../api';
import { useAlert } from '../context/AlertContext';
import { COLORS } from '../constants';
// import { useTheme } from '../context/ThemeContext'; // Removed

export default function NotificationsScreen({ navigation }) {
    // const { theme } = useTheme(); // Removed
    const { showAlert } = useAlert();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await notificationsAPI.getNotifications();
            setNotifications(data.results || data || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Don't show alert on initial load to avoid annoyance if offline
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = () => {
        setIsRefreshing(true);
        loadNotifications();
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            loadNotifications();
            showAlert({
                type: 'success',
                title: 'All Caught Up!',
                message: 'All notifications have been marked as read.',
                buttons: [{ text: 'OK' }],
            });
        } catch (error) {
            console.error('Error marking all read:', error);
            showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to mark notifications as read.',
                buttons: [{ text: 'OK' }],
            });
        }
    };

    const handleNotificationPress = async (item) => {
        // Mark as read if unread
        if (!item.is_read) {
            try {
                await notificationsAPI.markAsRead(item.id);
                // Optimistic update
                setNotifications(prev =>
                    prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
                );
            } catch (error) {
                console.error('Error marking read:', error);
            }
        }

        // Navigate based on type
        if (item.related_match) {
            navigation.navigate('MatchDetail', { id: item.related_match });
        } else if (item.related_claim) {
            // navigation.navigate('ClaimDetail', { id: item.related_claim });
        }
    };

    const handleDelete = async (id) => {
        showAlert({
            type: 'confirm',
            title: 'Delete Notification',
            message: 'Are you sure you want to delete this notification?',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await notificationsAPI.deleteNotification(id);
                            setNotifications(prev => prev.filter(n => n.id !== id));
                        } catch (error) {
                            showAlert({
                                type: 'error',
                                title: 'Error',
                                message: 'Failed to delete notification.',
                                buttons: [{ text: 'OK' }],
                            });
                        }
                    }
                }
            ],
        });
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'MATCH_FOUND': return { name: 'magnify-scan', color: COLORS.primary };
            case 'CLAIM_SUBMITTED': return { name: 'clipboard-arrow-up-outline', color: COLORS.warning };
            case 'CLAIM_APPROVED': return { name: 'check-circle-outline', color: COLORS.success };
            case 'CLAIM_REJECTED': return { name: 'close-circle-outline', color: COLORS.error };
            case 'PROOF_REQUIRED': return { name: 'alert-circle-outline', color: COLORS.warning };
            case 'ITEM_EXPIRED': return { name: 'clock-alert-outline', color: COLORS.textSecondary };
            default: return { name: 'bell-outline', color: COLORS.textSecondary };
        }
    };

    const renderNotification = ({ item }) => {
        const iconInfo = getIconForType(item.notification_type);

        return (
            <TouchableOpacity
                style={[styles.card, !item.is_read && styles.unreadCard]}
                onPress={() => handleNotificationPress(item)}
                onLongPress={() => handleDelete(item.id)}
            >
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name={iconInfo.name} size={24} color={iconInfo.color} />
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.title, !item.is_read && styles.unreadText]}>
                            {item.title}
                        </Text>
                        <Text style={styles.date}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <Text style={[styles.message, !item.is_read && styles.unreadText]}>
                        {item.message}
                    </Text>
                </View>
                {!item.is_read && (
                    <View style={styles.unreadDot} />
                )}
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={
                    notifications.length > 0 && notifications.some(n => !n.is_read) ? (
                        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
                            <Text style={styles.markAllText}>Mark all as read</Text>
                            <MaterialCommunityIcons name="check-all" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="bell-sleep-outline" size={48} color={COLORS.textLight} style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptySubtitle}>
                            You're all caught up!
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
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
    listContent: {
        padding: 16,
    },
    markAllButton: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    markAllText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
        marginRight: 4,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'flex-start',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    unreadCard: {
        backgroundColor: COLORS.cardBlue || '#F0F9FF',
        borderColor: COLORS.blueFaded || '#BAE6FD',
    },
    iconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    date: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    message: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    unreadText: {
        color: COLORS.text,
        fontWeight: '500',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginLeft: 8,
        marginTop: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});
