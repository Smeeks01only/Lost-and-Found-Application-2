/**
 * Staff Claims Review Screen
 * Allows staff to review and approve/reject pending claims
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { matchesAPI } from '../../api';
import { COLORS, STATUS_LABELS } from '../../constants';

export default function ClaimsReviewScreen({ navigation }) {
    const [claims, setClaims] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');

    const loadClaims = useCallback(async () => {
        try {
            const data = await matchesAPI.getPendingClaims();
            setClaims(data.results || data || []);
        } catch (error) {
            console.error('Error loading claims:', error);
            Alert.alert('Error', 'Failed to load pending claims');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadClaims();
    }, [loadClaims]);

    const onRefresh = () => {
        setIsRefreshing(true);
        loadClaims();
    };

    const handleReview = (claim) => {
        setSelectedClaim(claim);
        setReviewNotes('');
        setShowReviewModal(true);
    };

    const submitReview = async (approved) => {
        if (!selectedClaim) return;

        try {
            await matchesAPI.reviewClaim(selectedClaim.id, {
                approved,
                notes: reviewNotes,
            });
            Alert.alert(
                'Success',
                `Claim ${approved ? 'approved' : 'rejected'} successfully`
            );
            setShowReviewModal(false);
            setSelectedClaim(null);
            loadClaims();
        } catch (error) {
            console.error('Error reviewing claim:', error);
            Alert.alert('Error', 'Failed to submit review');
        }
    };

    const renderClaim = ({ item }) => {
        const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: '#6B7280', fadedBg: 'rgba(107, 114, 128, 0.15)' };

        return (
            <TouchableOpacity
                style={styles.claimCard}
                onPress={() => handleReview(item)}
            >
                <View style={styles.claimHeader}>
                    <Text style={styles.claimTitle}>
                        Claim #{item.id?.toString().slice(-6) || 'N/A'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.fadedBg }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.claimDetails}>
                    <Text style={styles.detailLabel}>Lost Item:</Text>
                    <Text style={styles.detailValue}>{item.match?.lost_item?.title || 'Unknown'}</Text>
                </View>

                <View style={styles.claimDetails}>
                    <Text style={styles.detailLabel}>Found Item:</Text>
                    <Text style={styles.detailValue}>{item.match?.found_item?.title || 'Unknown'}</Text>
                </View>

                <View style={styles.claimDetails}>
                    <Text style={styles.detailLabel}>Claimant:</Text>
                    <Text style={styles.detailValue}>{item.claimant?.full_name || 'Unknown'}</Text>
                </View>

                <View style={styles.claimDetails}>
                    <Text style={styles.detailLabel}>Match Score:</Text>
                    <Text style={styles.matchScore}>
                        {(item.match?.score * 100 || 0).toFixed(0)}%
                    </Text>
                </View>

                <Text style={styles.claimDate}>
                    Submitted: {new Date(item.created_at).toLocaleDateString()}
                </Text>

                <View style={styles.reviewPrompt}>
                    <Text style={styles.reviewPromptText}>Tap to review →</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Pending Claims</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{claims.length}</Text>
                </View>
            </View>

            <FlatList
                data={claims}
                renderItem={renderClaim}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>✅</Text>
                        <Text style={styles.emptyTitle}>No Pending Claims</Text>
                        <Text style={styles.emptySubtitle}>
                            All claims have been reviewed
                        </Text>
                    </View>
                }
            />

            {/* Review Modal */}
            <Modal
                visible={showReviewModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Review Claim</Text>

                        {selectedClaim && (
                            <View style={styles.claimSummary}>
                                <Text style={styles.summaryText}>
                                    <Text style={styles.summaryLabel}>Lost: </Text>
                                    {selectedClaim.match?.lost_item?.title}
                                </Text>
                                <Text style={styles.summaryText}>
                                    <Text style={styles.summaryLabel}>Found: </Text>
                                    {selectedClaim.match?.found_item?.title}
                                </Text>
                                <Text style={styles.summaryText}>
                                    <Text style={styles.summaryLabel}>Claimant: </Text>
                                    {selectedClaim.claimant?.full_name}
                                </Text>
                            </View>
                        )}

                        <TextInput
                            style={styles.notesInput}
                            value={reviewNotes}
                            onChangeText={setReviewNotes}
                            placeholder="Add review notes (optional)..."
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => submitReview(false)}
                            >
                                <Text style={styles.rejectButtonText}>Reject</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.approveButton]}
                                onPress={() => submitReview(true)}
                            >
                                <Text style={styles.approveButtonText}>Approve</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.cancelModalButton}
                            onPress={() => setShowReviewModal(false)}
                        >
                            <Text style={styles.cancelModalText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    countBadge: {
        backgroundColor: COLORS.warning,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: {
        color: '#fff',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    claimCard: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    claimHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    claimTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    claimDetails: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        width: 100,
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.text,
        flex: 1,
    },
    matchScore: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.success,
    },
    claimDate: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 8,
    },
    reviewPrompt: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    reviewPromptText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
        textAlign: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
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
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    claimSummary: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 4,
    },
    summaryLabel: {
        fontWeight: '600',
    },
    notesInput: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        textAlignVertical: 'top',
        marginBottom: 16,
        minHeight: 80,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: COLORS.errorFaded,
    },
    rejectButtonText: {
        color: COLORS.error,
        fontWeight: '600',
    },
    approveButton: {
        backgroundColor: COLORS.success,
    },
    approveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    cancelModalButton: {
        marginTop: 12,
        padding: 12,
        alignItems: 'center',
    },
    cancelModalText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
});
