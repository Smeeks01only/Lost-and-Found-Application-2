/**
 * Submit Claim Screen
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { matchesAPI } from '../../api';
import { COLORS } from '../../constants';
// import { useTheme } from '../../context/ThemeContext'; // Removed

export default function SubmitClaimScreen({ route, navigation }) {
    const { matchId } = route.params;
    // const { theme } = useTheme(); // Removed
    const [match, setMatch] = useState(null);
    const [secretAnswer, setSecretAnswer] = useState('');
    const [additionalProof, setAdditionalProof] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadMatch();
    }, []);

    const loadMatch = async () => {
        try {
            const data = await matchesAPI.getMatch(matchId);
            setMatch(data);
        } catch (error) {
            console.error('Error loading match:', error);
            Alert.alert('Error', 'Failed to load match details');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!secretAnswer.trim()) {
            Alert.alert('Required', 'Please answer the secret question');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await matchesAPI.submitClaim(matchId, {
                secret_answer: secretAnswer,
                additional_proof: additionalProof,
            });

            if (response.is_correct_answer) {
                Alert.alert(
                    '✅ Correct Answer!',
                    response.message,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert(
                    '❌ Incorrect Answer',
                    `${response.message}\n\nAttempts remaining: ${response.attempts_remaining}`,
                    [{ text: 'Try Again' }]
                );
                setSecretAnswer('');
            }
        } catch (error) {
            console.error('Error submitting claim:', error);
            const message = error.response?.data?.error || 'Failed to submit claim';
            Alert.alert('Error', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Match Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Found Item</Text>
                    <Text style={styles.infoItemTitle}>
                        {match?.found_item?.title || match?.found_item_title || 'Item'}
                    </Text>
                    <Text style={styles.infoLocation}>
                        📍 {match?.found_item?.location_found || match?.found_item_location || 'Location'}
                    </Text>
                </View>

                {/* Secret Question */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Verification Question</Text>
                    <Text style={styles.questionText}>
                        {match?.found_item?.secret_question || 'What is a distinguishing feature of your item?'}
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Your Answer *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your answer"
                            placeholderTextColor={COLORS.textLight}
                            value={secretAnswer}
                            onChangeText={setSecretAnswer}
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                {/* Additional Proof */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Additional Proof (Optional)</Text>
                    <Text style={styles.hint}>
                        Provide any additional details that prove this item belongs to you
                    </Text>

                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="e.g., There's a scratch on the back, my initials inside, etc."
                        placeholderTextColor={COLORS.textLight}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={additionalProof}
                        onChangeText={setAdditionalProof}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Claim</Text>
                    )}
                </TouchableOpacity>

                {/* Warning */}
                <View style={styles.warning}>
                    <Text style={styles.warningText}>
                        ⚠️ You have 3 attempts to answer correctly. False claims may result in account restrictions.
                    </Text>
                </View>
            </View>
        </ScrollView>
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
        padding: 16,
    },
    infoCard: {
        backgroundColor: COLORS.primaryFaded,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    infoTitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    infoItemTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    infoLocation: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    questionText: {
        fontSize: 16,
        color: COLORS.text,
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    hint: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    inputContainer: {
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.text,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    warning: {
        marginTop: 16,
        padding: 12,
        backgroundColor: COLORS.warningFaded,
        borderRadius: 8,
    },
    warningText: {
        fontSize: 13,
        color: COLORS.warning,
        textAlign: 'center',
    },
});
