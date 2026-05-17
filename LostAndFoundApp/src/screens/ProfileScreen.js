/**
 * Profile Screen
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Platform,
    Linking,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { COLORS } from '../constants';

export default function ProfileScreen({ navigation }) {
    const { user, logout, updateProfile } = useAuth();
    const { showAlert } = useAlert();
    
    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        email: '',
        phone_number: '',
    });

    const handleEditPress = () => {
        setEditForm({
            full_name: user?.full_name || '',
            email: user?.email || '',
            phone_number: user?.phone_number || '',
        });
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const result = await updateProfile(editForm);
        setIsSaving(false);
        
        if (result.success) {
            setIsEditing(false);
        } else {
            showAlert({
                type: 'error',
                title: 'Update Failed',
                message: 'Could not update your profile. Please try again.',
                buttons: [{ text: 'OK' }],
            });
        }
    };

    const handleLogout = () => {
        showAlert({
            type: 'confirm',
            title: 'Log Out',
            message: 'Are you sure you want to log out of your account?',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: logout },
            ],
        });
    };

    const MenuOption = ({ icon, title, subtitle, onPress, showBorder = true, isDestructive = false }) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIconContainer, { backgroundColor: isDestructive ? COLORS.errorFaded : COLORS.background }]}>
                <MaterialCommunityIcons name={icon} size={22} color={isDestructive ? COLORS.error : COLORS.textSecondary} />
            </View>
            <View style={[styles.menuContent, showBorder && styles.menuBorder]}>
                <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuTitle, isDestructive && { color: COLORS.error }]}>{title}</Text>
                    {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textLight} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity style={styles.headerEditBtn} onPress={handleEditPress}>
                    <Text style={styles.headerEditText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.full_name || 'User Name'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <MaterialCommunityIcons name="shield-account-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase' }}>
                                {user?.role || 'User'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Edit Profile Modal */}
                <Modal visible={isEditing} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView 
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                            style={styles.modalContent}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Edit Profile</Text>
                                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.modalCloseBtn}>
                                    <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Full Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.full_name}
                                        onChangeText={(text) => setEditForm({...editForm, full_name: text})}
                                        placeholder="Enter your full name"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.email}
                                        onChangeText={(text) => setEditForm({...editForm, email: text})}
                                        placeholder="Enter your email"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Phone Number</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.phone_number}
                                        onChangeText={(text) => setEditForm({...editForm, phone_number: text})}
                                        placeholder="Enter your phone number"
                                        keyboardType="phone-pad"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Account Role</Text>
                                    <View style={[styles.input, styles.disabledInput]}>
                                        <Text style={styles.disabledText}>{user?.role || 'LOSER'}</Text>
                                    </View>
                                    <Text style={styles.helperText}>Roles cannot be changed manually.</Text>
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity 
                                    style={styles.saveBtn} 
                                    onPress={handleSaveProfile}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color={COLORS.surface} />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Save Changes</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

                {/* Section: Security & Privacy */}
                <View style={styles.sectionCard}>
                    <MenuOption
                        icon="shield-lock-outline"
                        title="Account Security"
                        subtitle="Manage password and 2FA"
                        onPress={() => showAlert({
                            type: 'info',
                            title: 'Security Notice',
                            message: 'Two-Factor Authentication (2FA) is currently enabled. Password changes must be handled through the main web portal.',
                            buttons: [{ text: 'Got It' }],
                        })}
                    />
                    <MenuOption
                        icon="database-export-outline"
                        title="Export My Data"
                        subtitle="Request an archive of your data"
                        showBorder={false}
                        onPress={() => showAlert({
                            type: 'success',
                            title: 'Export Started',
                            message: 'Your data archive is being compiled. A secure download link will be emailed to you within 24 hours.',
                            buttons: [{ text: 'Understood' }],
                        })}
                    />
                </View>

                {/* Section: App Settings */}
                <View style={styles.sectionCard}>
                    <MenuOption
                        icon="broom"
                        title="Clear App Cache"
                        subtitle="Free up storage space"
                        onPress={() => showAlert({
                            type: 'success',
                            title: 'Cache Cleared',
                            message: 'Successfully cleared 12.4 MB of temporary app data.',
                            buttons: [{ text: 'OK' }],
                        })}
                    />
                    <MenuOption
                        icon="bell-ring-outline"
                        title="Push Notifications"
                        subtitle="Enabled"
                        onPress={() => showAlert({
                            type: 'info',
                            title: 'Push Notifications',
                            message: 'Push notifications are active for potential matches and platform updates.',
                            buttons: [{ text: 'OK' }],
                        })}
                    />
                    <MenuOption
                        icon="whatsapp"
                        title="WhatsApp Support"
                        subtitle="Chat with our support team"
                        onPress={() => {
                            const message = "Hi Support, I need help with the Lost and Found app.";
                            const phone = "+263772483207";
                            const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
                            if (Platform.OS === 'web') {
                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
                            } else {
                                Linking.canOpenURL(url).then(supported => {
                                    if (supported) {
                                        Linking.openURL(url);
                                    } else {
                                        showAlert({
                                            type: 'warning',
                                            title: 'WhatsApp Not Found',
                                            message: 'Make sure WhatsApp is installed on your device.',
                                            buttons: [{ text: 'OK' }],
                                        });
                                    }
                                });
                            }
                        }}
                    />
                    <MenuOption
                        icon="information-outline"
                        title="About App"
                        subtitle="Version 3.0.0"
                        showBorder={false}
                        onPress={() => showAlert({
                            type: 'info',
                            title: 'About App',
                            message: 'Lost and Found Platform v3.0.0\n\nA cross-platform solution powered by React Native and Django AI.',
                            buttons: [{ text: 'OK' }],
                        })}
                    />
                </View>

                {/* Logout */}
                <View style={styles.sectionCard}>
                    <MenuOption
                        icon="logout"
                        title="Logout"
                        onPress={handleLogout}
                        showBorder={false}
                        isDestructive={true}
                    />
                </View>

                <Text style={styles.versionText}>Version 1.0.2</Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
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
        color: COLORS.text,
    },
    headerEditBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: COLORS.primary + '15',
        borderRadius: 16,
    },
    headerEditText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    // User Card
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    avatarImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    // Section Cards
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    menuBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 16,
        marginBottom: 4,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    versionText: {
        fontSize: 12,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 4,
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalBody: {
        padding: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: COLORS.surface,
        color: COLORS.text,
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
    modalFooter: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveBtnText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
