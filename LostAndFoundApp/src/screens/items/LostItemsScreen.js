/**
 * Lost Items Screen - List and manage user's lost items
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { itemsAPI } from '../../api';
import { COLORS, STATUS_LABELS, CATEGORIES } from '../../constants';

export default function LostItemsScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadItems = async () => {
        try {
            const response = await itemsAPI.getLostItems();
            setItems(response.results || response || []);
        } catch (error) {
            console.error('Error loading items:', error);
            Alert.alert('Error', 'Failed to load items');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadItems();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadItems();
    };

    const getCategoryIcon = (category) => {
        const cat = CATEGORIES.find((c) => c.value === category);
        return cat?.icon || '📦';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onPress={() => navigation.navigate('ItemDetail', { id: item.id, type: 'lost' })}
        >
            <View style={styles.itemIconContainer}>
                <Text style={styles.itemIcon}>{getCategoryIcon(item.category)}</Text>
            </View>

            <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemLocation} numberOfLines={1}>📍 {item.location_lost}</Text>
                <Text style={styles.itemDate}>Lost on {formatDate(item.date_lost)}</Text>
            </View>

            <View style={styles.itemRight}>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: STATUS_LABELS[item.status]?.fadedBg || 'rgba(107, 114, 128, 0.15)' },
                    ]}
                >
                    <Text
                        style={[styles.statusText, { color: STATUS_LABELS[item.status]?.color || '#6B7280' }]}
                    >
                        {STATUS_LABELS[item.status]?.label || item.status}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Lost Items</Text>
            <Text style={styles.emptyText}>You haven't reported any lost items yet</Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('ReportLostItem')}
            >
                <Text style={styles.emptyButtonText}>Report Lost Item</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
                ListEmptyComponent={renderEmptyList}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ReportLostItem')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
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
    list: {
        padding: 16,
        paddingBottom: 80,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemCard: {
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
    itemIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemIcon: {
        fontSize: 24,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemLocation: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    itemDate: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    itemRight: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    fabText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: '300',
        marginTop: -2,
    },
});
