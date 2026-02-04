/**
 * Matches Screen - View matches and submit claims
 * Enhanced with NLP animations and visual indicators
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Animated,
    Easing,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { matchesAPI } from '../../api';
import { COLORS, STATUS_LABELS } from '../../constants';

// Animated Match Score Component
const AnimatedScore = ({ score }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        // Animate score counting up
        Animated.timing(animatedValue, {
            toValue: score,
            duration: 1500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();

        // Pulse animation for high scores
        if (score > 0.8) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }

        animatedValue.addListener(({ value }) => {
            setDisplayScore(Math.round(value * 100));
        });

        return () => animatedValue.removeAllListeners();
    }, [score]);

    const getScoreColor = (scoreValue) => {
        if (scoreValue >= 80) return '#10B981'; // Green - Excellent
        if (scoreValue >= 60) return '#F59E0B'; // Orange - Good
        return '#6B7280'; // Gray - Low
    };

    return (
        <Animated.View style={[styles.scoreCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(displayScore) }]}>
                {displayScore}%
            </Text>
            <Text style={styles.nlpBadge}>🤖 AI Match</Text>
        </Animated.View>
    );
};

// Animated Match Card Component  
const MatchCard = ({ item, index, onPress, onClaim }) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 100,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [index]);

    return (
        <Animated.View
            style={[
                styles.matchCard,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                },
            ]}
        >
            <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                {/* NLP Score Badge */}
                <View style={styles.nlpHeader}>
                    <AnimatedScore score={item.final_score || 0} />
                </View>

                {/* Semantic Match Indicators */}
                <View style={styles.matchFactors}>
                    <View style={styles.factorItem}>
                        <Text style={styles.factorIcon}>📝</Text>
                        <View style={styles.factorBar}>
                            <Animated.View
                                style={[
                                    styles.factorFill,
                                    { width: `${(item.text_similarity || 0.5) * 100}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.factorLabel}>Text</Text>
                    </View>
                    <View style={styles.factorItem}>
                        <Text style={styles.factorIcon}>📂</Text>
                        <View style={styles.factorBar}>
                            <Animated.View
                                style={[
                                    styles.factorFill,
                                    {
                                        width: `${(item.category_match ? 100 : 30)}%`,
                                        backgroundColor: item.category_match ? '#10B981' : '#EF4444'
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.factorLabel}>Category</Text>
                    </View>
                    <View style={styles.factorItem}>
                        <Text style={styles.factorIcon}>📍</Text>
                        <View style={styles.factorBar}>
                            <Animated.View
                                style={[
                                    styles.factorFill,
                                    { width: `${(item.location_score || 0.3) * 100}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.factorLabel}>Location</Text>
                    </View>
                </View>

                {/* Items Info */}
                <View style={styles.itemsContainer}>
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemLabel}>Your Lost Item</Text>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                            {item.lost_item_title || 'Lost Item'}
                        </Text>
                    </View>

                    <View style={styles.matchArrow}>
                        <Text style={styles.arrowText}>↔</Text>
                    </View>

                    <View style={styles.itemInfo}>
                        <Text style={styles.itemLabel}>Found Item</Text>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                            {item.found_item_title || 'Found Item'}
                        </Text>
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
                        <TouchableOpacity style={styles.claimButton} onPress={onClaim}>
                            <Text style={styles.claimButtonText}>Claim Item</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Animated Empty State with NLP searching animation
const EmptyState = () => {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Continuous rotation for "searching" effect
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Breathing effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.emptyContainer}>
            <Animated.View
                style={{
                    transform: [{ rotate: spin }, { scale: scaleAnim }],
                }}
            >
                <Text style={styles.emptyIcon}>🔍</Text>
            </Animated.View>
            <Text style={styles.emptyTitle}>AI is Searching...</Text>
            <Text style={styles.emptyText}>
                Our NLP engine is analyzing item descriptions
            </Text>
            <View style={styles.nlpFeatures}>
                <View style={styles.featureTag}>
                    <Text style={styles.featureText}>🧠 Semantic Analysis</Text>
                </View>
                <View style={styles.featureTag}>
                    <Text style={styles.featureText}>📊 Pattern Matching</Text>
                </View>
                <View style={styles.featureTag}>
                    <Text style={styles.featureText}>🎯 Smart Scoring</Text>
                </View>
            </View>
            <Text style={styles.emptySubtext}>
                You'll be notified when we find potential matches
            </Text>
        </View>
    );
};

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

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Analyzing matches...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with NLP badge */}
            <View style={styles.headerBanner}>
                <Text style={styles.headerTitle}>🤖 AI-Powered Matches</Text>
                <Text style={styles.headerSubtitle}>
                    Semantic matching using NLP technology
                </Text>
            </View>

            <FlatList
                data={matches}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                    <MatchCard
                        item={item}
                        index={index}
                        onPress={() => navigation.navigate('MatchDetail', { id: item.id })}
                        onClaim={() => navigation.navigate('SubmitClaim', { matchId: item.id })}
                    />
                )}
                contentContainerStyle={matches.length === 0 ? styles.emptyList : styles.list}
                ListEmptyComponent={<EmptyState />}
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
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    headerBanner: {
        backgroundColor: COLORS.primaryFaded,
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
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
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    nlpHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    scoreCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    scoreText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    nlpBadge: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    matchFactors: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    factorItem: {
        alignItems: 'center',
        width: '30%',
    },
    factorIcon: {
        fontSize: 16,
        marginBottom: 4,
    },
    factorBar: {
        width: '100%',
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    factorFill: {
        height: '100%',
        backgroundColor: COLORS.secondary,
        borderRadius: 3,
    },
    factorLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 4,
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
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
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
        fontSize: 72,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    nlpFeatures: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    featureTag: {
        backgroundColor: COLORS.primaryFaded,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    featureText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
    },
});
