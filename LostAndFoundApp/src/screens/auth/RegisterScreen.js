/**
 * Register Screen
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { COLORS } from '../../constants';

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const { showAlert } = useAlert();

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        password: '',
        password_confirm: '',
    });

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: null });
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';

        if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';

        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

        if (formData.password !== formData.password_confirm) {
            newErrors.password_confirm = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setIsLoading(true);
        const result = await register(formData);

        if (result.success) {
            showAlert({
                type: 'success',
                title: 'Registration Successful!',
                message: 'Your account has been created. Please sign in to continue.',
                buttons: [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }],
            });
        } else {
            if (typeof result.errors === 'object') {
                setErrors(result.errors);
            } else {
                showAlert({
                    type: 'error',
                    title: 'Registration Failed',
                    message: result.message || 'Please try again.',
                    buttons: [{ text: 'OK' }],
                });
            }
        }

        setIsLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* Wavy Background Decorations */}
            <View style={styles.topDecoration} />
            <View style={styles.bottomDecoration} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Sign up to get started</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Full Name */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={[styles.input, errors.full_name && styles.inputError]}
                                placeholder="Enter your full name"
                                placeholderTextColor={COLORS.textLight}
                                value={formData.full_name}
                                onChangeText={(v) => updateField('full_name', v)}
                            />
                            {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                placeholder="Enter your email"
                                placeholderTextColor={COLORS.textLight}
                                value={formData.email}
                                onChangeText={(v) => updateField('email', v)}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* Phone Number */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Phone Number (Optional)</Text>
                            <TextInput
                                style={[styles.input, errors.phone_number && styles.inputError]}
                                placeholder="Enter your phone number"
                                placeholderTextColor={COLORS.textLight}
                                value={formData.phone_number}
                                onChangeText={(v) => updateField('phone_number', v)}
                                keyboardType="phone-pad"
                            />
                            {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
                        </View>

                        {/* Role (Read-only) */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Account Role</Text>
                            <View style={[styles.input, styles.disabledInput]}>
                                <Text style={styles.disabledText}>Loser (Default)</Text>
                            </View>
                            <Text style={styles.helperText}>
                                To request Office or Tech roles, please contact an Admin.
                            </Text>
                        </View>

                        {/* Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Create a password"
                                    placeholderTextColor={COLORS.textLight}
                                    value={formData.password}
                                    onChangeText={(v) => updateField('password', v)}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    <MaterialCommunityIcons
                                        name={isPasswordVisible ? "eye-off" : "eye"}
                                        size={24}
                                        color={COLORS.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={[styles.passwordContainer, errors.password_confirm && styles.inputError]}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Confirm your password"
                                    placeholderTextColor={COLORS.textLight}
                                    value={formData.password_confirm}
                                    onChangeText={(v) => updateField('password_confirm', v)}
                                    secureTextEntry={!isConfirmPasswordVisible}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                                    <MaterialCommunityIcons
                                        name={isConfirmPasswordVisible ? "eye-off" : "eye"}
                                        size={24}
                                        color={COLORS.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password_confirm && <Text style={styles.errorText}>{errors.password_confirm}</Text>}
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={COLORS.surface} />
                            ) : (
                                <Text style={styles.buttonText}>Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 8 }}>
                                <Text style={styles.link}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        position: 'relative',
    },
    topDecoration: {
        position: 'absolute',
        top: -150,
        left: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: COLORS.primary,
        opacity: 0.1,
    },
    bottomDecoration: {
        position: 'absolute',
        bottom: -200,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: COLORS.primary,
        opacity: 0.1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        padding: 24,
        paddingTop: 60,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: COLORS.text,
        backgroundColor: COLORS.surface,
    },
    disabledInput: {
        backgroundColor: '#EAEAEA',
        justifyContent: 'center',
    },
    disabledText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    helperText: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 6,
        fontStyle: 'italic',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surface,
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: 4,
    },
    button: {
        height: 50,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    link: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: 'bold',
    },
});
