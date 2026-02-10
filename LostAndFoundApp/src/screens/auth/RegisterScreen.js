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
    Alert,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants';

export default function RegisterScreen({ navigation }) {
    const { register, login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
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
            Alert.alert(
                'Registration Successful',
                'Your account has been created. Please sign in.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } else {
            // Handle validation errors from API
            if (typeof result.errors === 'object') {
                setErrors(result.errors);
            } else {
                Alert.alert('Registration Failed', 'Please try again');
            }
        }

        setIsLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Sign up to get started</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={[styles.input, errors.full_name && styles.inputError]}
                                placeholder="Enter your full name"
                                value={formData.full_name}
                                onChangeText={(v) => updateField('full_name', v)}
                            />
                            {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                placeholder="Enter your email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(v) => updateField('email', v)}
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Phone Number (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your phone number"
                                keyboardType="phone-pad"
                                value={formData.phone_number}
                                onChangeText={(v) => updateField('phone_number', v)}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                                    placeholder="Create a password"
                                    secureTextEntry={!isPasswordVisible}
                                    value={formData.password}
                                    onChangeText={(v) => updateField('password', v)}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                >
                                    <MaterialCommunityIcons
                                        name={isPasswordVisible ? 'eye-off' : 'eye'}
                                        size={24}
                                        color={COLORS.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput, errors.password_confirm && styles.inputError]}
                                    placeholder="Confirm your password"
                                    secureTextEntry={!isConfirmPasswordVisible}
                                    value={formData.password_confirm}
                                    onChangeText={(v) => updateField('password_confirm', v)}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                >
                                    <MaterialCommunityIcons
                                        name={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
                                        size={24}
                                        color={COLORS.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password_confirm && (
                                <Text style={styles.errorText}>{errors.password_confirm}</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.linkText}>Sign In</Text>
                        </TouchableOpacity>
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
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    form: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
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
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 16,
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
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    linkText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
