/**
 * Matches Screen - View matches and submit claims
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { matchesAPI } from '../../api';
import { COLORS, STATUS_LABELS } from '../../constants';

export default function MatchesScreen({ navigation }) {
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMatches = async () => {
        try {
            const response = await matchesAPI.getMatches();
            setMatches(response.results || response || []);
        } catch (error) {
            console.error('Error loading matches:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadMatches();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadMatches();
    };

    const formatScore = (score) => {
        return `${Math.round(score * 100)}%`;
    };

    const renderMatch = ({ item }) => (
        <TouchableOpacity
            style={styles.matchCard}
            onPress={() => navigation.navigate('MatchDetail', { id: item.id })}
        >
            {/* Match Score */}
            <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>{formatScore(item.final_score)}</Text>
                <Text style={styles.scoreLabel}>match</Text>
            </View>

            {/* Items Info */}
            <View style={styles.itemsContainer}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemLabel}>Your Lost Item</Text>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.lost_item_title || 'Lost Item'}</Text>
                </View>

                <View style={styles.matchArrow}>
                    <Text style={styles.arrowText}>↔</Text>
                </View>

                <View style={styles.itemInfo}>
                    <Text style={styles.itemLabel}>Found Item</Text>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.found_item_title || 'Found Item'}</Text>
                </View>
            </View>

            {/* Status */}
            <View style={styles.matchFooter}>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: STATUS_LABELS[item.status]?.fadedBg || 'rgba(107, 114, 128, 0.15)' },
                    ]}
                >
                    <Text style={[styles.statusText, { color: STATUS_LABELS[item.status]?.color || '#6B7280' }]}>
                        {STATUS_LABELS[item.status]?.label || item.status}
                    </Text>
                </View>

                {item.status === 'POTENTIAL' && (
                    <TouchableOpacity
                        style={styles.claimButton}
                        onPress={() => navigation.navigate('SubmitClaim', { matchId: item.id })}
                    >
                        <Text style={styles.claimButtonText}>Claim</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No Matches Yet</Text>
            <Text style={styles.emptyText}>We're actively searching for your items</Text>
            <Text style={styles.emptySubtext}>You'll be notified when we find potential matches</Text>
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
                data={matches}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMatch}
                contentContainerStyle={matches.length === 0 ? styles.emptyList : styles.list}
                ListEmptyComponent={renderEmptyList}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
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
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    matchCard: {
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
    scoreContainer: {
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    scoreText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.secondary,
    },
    scoreLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    itemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemInfo: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    matchArrow: {
        paddingHorizontal: 8,
    },
    arrowText: {
        fontSize: 20,
        color: COLORS.textLight,
    },
    matchFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    claimButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    claimButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
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
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
    },
});
