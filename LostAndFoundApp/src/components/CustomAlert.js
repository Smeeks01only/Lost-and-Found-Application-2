/**
 * Custom Alert Component
 * A clean, concise modal using the app's colour palette.
 */

import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlert } from '../context/AlertContext';
import { COLORS } from '../constants';

const TYPE_CONFIG = {
    success: {
        icon: 'check-circle-outline',
        iconColor: COLORS.success,
        accentColor: COLORS.success,
    },
    error: {
        icon: 'close-circle-outline',
        iconColor: COLORS.error,
        accentColor: COLORS.error,
    },
    warning: {
        icon: 'alert-circle-outline',
        iconColor: COLORS.warning,
        accentColor: COLORS.warning,
    },
    info: {
        icon: 'information-outline',
        iconColor: COLORS.primary,
        accentColor: COLORS.primary,
    },
    confirm: {
        icon: 'help-circle-outline',
        iconColor: COLORS.primary,
        accentColor: COLORS.primary,
    },
};

export default function CustomAlert() {
    const { alertConfig, hideAlert } = useAlert();
    const { visible, type, title, message, buttons } = alertConfig;

    const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

    const handleButtonPress = (btn) => {
        hideAlert();
        if (btn.onPress) {
            setTimeout(btn.onPress, 150);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={hideAlert}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Icon — bare, no outer circle */}
                    <MaterialCommunityIcons
                        name={config.icon}
                        size={44}
                        color={config.iconColor}
                        style={styles.icon}
                    />

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    {message ? (
                        <Text style={styles.message}>{message}</Text>
                    ) : null}

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Buttons */}
                    <View style={[styles.buttonRow, buttons.length === 1 && styles.buttonRowSingle]}>
                        {buttons.map((btn, index) => {
                            const isDestructive = btn.style === 'destructive';
                            const isCancel = btn.style === 'cancel';
                            const isPrimary = index === buttons.length - 1 && !isCancel;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        buttons.length === 1 && styles.buttonFull,
                                        isPrimary && { backgroundColor: isDestructive ? COLORS.error : config.accentColor },
                                        isCancel && styles.buttonCancel,
                                        !isPrimary && !isCancel && styles.buttonOutline,
                                    ]}
                                    onPress={() => handleButtonPress(btn)}
                                    activeOpacity={0.75}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            isPrimary && styles.buttonTextPrimary,
                                            isCancel && { color: COLORS.textSecondary },
                                            !isPrimary && !isCancel && { color: COLORS.textSecondary },
                                        ]}
                                    >
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 28,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 20,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 12,
    },
    icon: {
        marginBottom: 14,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 6,
    },
    message: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 4,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    buttonRowSingle: {
        flexDirection: 'column',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonFull: {
        flex: undefined,
        width: '100%',
    },
    buttonCancel: {
        backgroundColor: COLORS.divider,
    },
    buttonOutline: {
        backgroundColor: COLORS.divider,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    buttonTextPrimary: {
        color: '#FFFFFF',
    },
});
