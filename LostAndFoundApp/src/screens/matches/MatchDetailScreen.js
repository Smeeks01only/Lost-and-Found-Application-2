/**
 * Match Detail Screen
 * Displays details of a match
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Linking,
    Platform,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { matchesAPI } from '../../api';
import { STATUS_LABELS, COLORS } from '../../constants';
import { useAuth } from '../../context/AuthContext';

export default function MatchDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const { user } = useAuth();
    const [match, setMatch] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadMatch = async () => {
            try {
                const data = await matchesAPI.getMatch(id);
                setMatch(data);
            } catch (error) {
                console.error('Error loading match:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadMatch();
    }, [id]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!match) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Match not found</Text>
            </View>
        );
    }

    const { lost_item, found_item, score_breakdown, final_score } = match;

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Match Header */}
                <View style={styles.header}>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreText}>{(final_score * 100).toFixed(0)}%</Text>
                        <Text style={styles.scoreLabel}>Match</Text>
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Potential Match Found</Text>
                        <Text style={styles.subtitle}>
                            Comparing your lost item with a found item
                        </Text>
                    </View>
                </View>

                {/* Score Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Match Analysis</Text>
                    <View style={styles.breakdownCard}>
                        {Object.entries(score_breakdown || {}).map(([key, value]) => (
                            <View key={key} style={styles.breakdownItem}>
                                <Text style={styles.breakdownLabel}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)} Similarity
                                </Text>
                                <Text style={styles.breakdownValue}>{value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Comparison */}
                <View style={styles.comparisonContainer}>
                    <View style={styles.itemColumn}>
                        <Text style={styles.columnHeader}>Lost Item</Text>
                        <View style={styles.itemCard}>
                            <Text style={styles.itemTitle}>{lost_item?.title}</Text>
                            <Text style={styles.itemDetail}>{lost_item?.category}</Text>
                            <Text style={styles.itemDetail}>{lost_item?.location_lost}</Text>
                            <Text style={styles.itemDate}>
                                {new Date(lost_item?.date_lost).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    <MaterialCommunityIcons
                        name="compare-horizontal"
                        size={24}
                        color={COLORS.textSecondary}
                        style={styles.compareIcon}
                    />

                    <View style={styles.itemColumn}>
                        <Text style={styles.columnHeader}>Found Item</Text>
                        <View style={styles.itemCard}>
                            <Text style={styles.itemTitle}>{found_item?.title}</Text>
                            <Text style={styles.itemDetail}>{found_item?.category}</Text>
                            <Text style={styles.itemDetail}>{found_item?.location_found}</Text>
                            <Text style={styles.itemDate}>
                                {new Date(found_item?.date_found).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Actions - Only visible to Loser */}
                {user?.role === 'LOSER' && (
                    <>
                        <TouchableOpacity
                            style={styles.claimButton}
                            onPress={() => navigation.navigate('SubmitClaim', { matchId: match.id })}
                        >
                            <Text style={styles.claimButtonText}>Initialize Claim</Text>
                        </TouchableOpacity>

                        {/* WhatsApp Contact Button */}
                        {/* <TouchableOpacity
                            style={[styles.claimButton, { backgroundColor: '#25D366', marginTop: 12, flexDirection: 'row', justifyContent: 'center' }]}
                            onPress={() => {
                                const message = `Hello! We noticed a potential match for your lost item: ${lost_item?.title}. Please contact us regarding your claim.`;
                                const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
                                if (Platform.OS === 'web') {
                                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
                                } else {
                                    Linking.canOpenURL(url).then(supported => {
                                        if (supported) {
                                            Linking.openURL(url);
                                        } else {
                                            Alert.alert('Error', 'Make sure WhatsApp is installed on your device.');
                                        }
                                    });
                                }
                            }}
                        >
                            <MaterialCommunityIcons name="whatsapp" size={22} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.claimButtonText}>Message User on WhatsApp</Text>
                        </TouchableOpacity> */}
                    </>
                )}
            </ScrollView>
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
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    scoreContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.successFaded || '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.success,
        marginRight: 16,
    },
    scoreText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.success,
    },
    scoreLabel: {
        fontSize: 10,
        color: COLORS.success,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
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
    breakdownCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    breakdownLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    breakdownValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    comparisonContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'center',
    },
    itemColumn: {
        flex: 1,
    },
    compareIcon: {
        marginHorizontal: 8,
        marginTop: 24,
    },
    columnHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
        textAlign: 'center',
    },
    itemCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 120,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemDetail: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    itemDate: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 8,
    },
    claimButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    claimButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        textAlign: 'center',
        marginTop: 40,
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});
