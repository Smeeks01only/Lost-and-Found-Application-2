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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { matchesAPI } from '../../api';
import { STATUS_LABELS, COLORS } from '../../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useTheme } from '../../context/ThemeContext'; // Removed

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
        if (scoreValue >= 80) return COLORS.success; // Green - Excellent
        if (scoreValue >= 60) return COLORS.warning; // Orange - Good
        return COLORS.textSecondary; // Gray - Low
    };

    return (
        <Animated.View style={[styles.scoreCircle, { transform: [{ scale: pulseAnim }], borderColor: getScoreColor(displayScore) }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(displayScore) }]}>
                {displayScore}%
            </Text>
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

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown Date';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getTimeDifference = (date1, date2) => {
        if (!date1 || !date2) return 0;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Simple score: 100% if same day, lose 10% per day difference
        return Math.max(0, 1 - (diffDays * 0.1));
    };

    const timeScore = item.date_score !== undefined ? item.date_score : getTimeDifference(item.created_at, item.found_item_date || new Date());

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
                {/* Header: Score & Date */}
                <View style={styles.cardHeader}>
                    <View style={styles.scoreContainer}>
                        <AnimatedScore score={item.final_score || 0} />
                    </View>
                    <View style={styles.dateContainer}>
                        <MaterialCommunityIcons name="calendar-clock" size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                    </View>
                </View>

                {/* Items Comparison */}
                <View style={styles.itemsContainer}>
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemLabel}>You Lost</Text>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                            {item.lost_item_title || 'Lost Item'}
                        </Text>
                        <Text style={styles.itemSubtext} numberOfLines={1}>
                            {item.lost_item_location || 'Unknown Location'}
                        </Text>
                    </View>

                    <View style={styles.matchArrow}>
                        <MaterialCommunityIcons name="arrow-right-thin" size={24} color={COLORS.primaryLight} />
                    </View>

                    <View style={styles.itemInfo}>
                        <Text style={styles.itemLabel}>We Found</Text>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                            {item.found_item_title || 'Found Item'}
                        </Text>
                        <Text style={styles.itemSubtext} numberOfLines={1}>
                            {item.found_item_location || 'No Location'}
                        </Text>
                    </View>
                </View>

                {/* Semantic Match Indicators */}
                <View style={styles.matchFactors}>
                    <View style={styles.factorItem}>
                        <Text style={styles.factorLabel}>Text</Text>
                        <View style={styles.factorBar}>
                            <Animated.View
                                style={[
                                    styles.factorFill,
                                    { width: `${(item.text_similarity || 0.5) * 100}%` },
                                ]}
                            />
                        </View>
                    </View>
                    <View style={styles.factorItem}>
                        <Text style={styles.factorLabel}>Location</Text>
                        <View style={styles.factorBar}>
                            <Animated.View
                                style={[
                                    styles.factorFill,
                                    { width: `${(item.location_score || 0.3) * 100}%` },
                                ]}
                            />
                        </View>
                    </View>
                    <View style={styles.factorItem}>
                        <Text style={styles.factorLabel}>Time</Text>
                        <View style={styles.factorBar}>
                            <Animated.View
                                style={[
                                    styles.factorFill,
                                    {
                                        width: `${(timeScore) * 100}%`,
                                        backgroundColor: timeScore > 0.7 ? COLORS.secondary : COLORS.warning
                                    },
                                ]}
                            />
                        </View>
                    </View>
                </View>

                {/* Status & Action */}
                <View style={styles.matchFooter}>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: STATUS_LABELS[item.status]?.color + '15' || COLORS.grayFaded },
                        ]}
                    >
                        <Text style={[styles.statusText, { color: STATUS_LABELS[item.status]?.color || COLORS.textSecondary }]}>
                            {STATUS_LABELS[item.status]?.label || item.status}
                        </Text>
                    </View>

                    {item.status === 'POTENTIAL' && (
                        <TouchableOpacity style={styles.claimButton} onPress={onClaim}>
                            <Text style={styles.claimButtonText}>View & Claim</Text>
                            <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Animated Empty State with NLP searching animation
const EmptyState = () => {
    // const { theme } = useTheme(); // Removed
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
                <MaterialCommunityIcons name="magnify-scan" size={72} color={COLORS.textSecondary} style={{ marginBottom: 16 }} />
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
    // const { theme } = useTheme(); // Removed
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
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header matching Profile Screen */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Matches</Text>
                <TouchableOpacity style={styles.headerIcon}>
                    <MaterialCommunityIcons name="filter-variant" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
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
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                />
            </View>
        </SafeAreaView>
    );
}

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Match Profile Screen background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textSecondary,
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
    list: {
        padding: 16,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // MatchCard Styles
    matchCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    scoreContainer: {
        // Container for animated score
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    dateText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    itemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    itemInfo: {
        flex: 1,
        maxWidth: '42%',
    },
    itemLabel: {
        fontSize: 11,
        color: COLORS.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    itemSubtext: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    matchArrow: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    matchFactors: {
        flexDirection: 'row',
        marginBottom: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.divider,
        gap: 16,
    },
    factorItem: {
        flex: 1,
    },
    factorLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginBottom: 6,
        fontWeight: '500',
    },
    factorBar: {
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
    matchFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    claimButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    claimButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    // Score Styles
    scoreCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.primaryFaded,
    },
    scoreText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    // Empty Styles
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
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
        backgroundColor: 'rgba(79, 70, 229, 0.15)', // Updated to consistent purple tint
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
