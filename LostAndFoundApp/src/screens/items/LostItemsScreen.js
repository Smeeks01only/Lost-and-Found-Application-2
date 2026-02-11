/**
 * Lost Items Screen - List and manage user's lost items
 * UI Pattern: Clean Card List (Prescriptions Style)
 */

import React, { useState, useCallback } from 'react';
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
import { STATUS_LABELS, CATEGORIES, COLORS } from '../../constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        return cat?.icon || 'package-variant';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown Date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {/* Header: Icon + Title */}
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryFaded }]}>
                    <MaterialCommunityIcons name={getCategoryIcon(item.category)} size={24} color={COLORS.primary} />
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                        {STATUS_LABELS[item.status]?.label || item.status}
                    </Text>
                </View>
            </View>

            {/* Body: Description / Location */}
            <View style={styles.cardBody}>
                <Text style={styles.bodyText}>
                    Lost at <Text style={styles.highlightText}>{item.location_lost}</Text>.
                    Please check for matches regularly.
                </Text>

                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>Reported: {formatDate(item.created_at || item.date_lost)}</Text>
                </View>
            </View>

            {/* Footer: Action Button */}
            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ItemDetail', { id: item.id, type: 'lost' })}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No Items Reported</Text>
            <Text style={styles.emptyText}>
                Your reported lost items will appear here using the synced list above.
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('ReportLostItem')}
            >
                <Text style={styles.emptyButtonText}>Report Lost Item</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.screenHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>My Items</Text>
            </View>

            <View style={styles.listContainer}>
                <Text style={styles.listDescription}>
                    Your synced lost items are included below. Feel free to check for potential matches.
                </Text>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={items}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={items.length === 0 ? styles.emptyListContent : styles.listContent}
                        ListEmptyComponent={renderEmptyList}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* FAB - Optional, if we want quick add similar to reference */}
            {/* 
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ReportLostItem')}
            >
                <MaterialCommunityIcons name="plus" size={28} color="#fff" />
            </TouchableOpacity>
            */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // Should be light gray/blueish
    },
    screenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        marginRight: 8,
        marginLeft: -8,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    listDescription: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginBottom: 20,
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 40,
    },
    emptyListContent: {
        flex: 1,
        justifyContent: 'center',
    },
    // Card Styles
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16, // Softer corners
        padding: 20,
        marginBottom: 16,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardBody: {
        marginBottom: 20,
    },
    bodyText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 22,
        marginBottom: 8,
    },
    highlightText: {
        color: COLORS.text,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaText: {
        fontSize: 13,
        color: COLORS.textLight,
    },
    cardFooter: {
        alignItems: 'flex-end',
    },
    actionButton: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    actionButtonText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    // Empty State
    emptyContainer: {
        alignItems: 'center',
        padding: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    emptyButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        elevation: 4,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
});
