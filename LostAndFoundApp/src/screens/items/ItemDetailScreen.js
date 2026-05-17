/**
 * Item Detail Screen
 * Displays details of a lost item
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Linking,
    Platform,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { itemsAPI } from '../../api';
import { STATUS_LABELS, COLORS } from '../../constants';
// import { useTheme } from '../../context/ThemeContext'; // Removed

export default function ItemDetailScreen({ route, navigation }) {
    const { id, type = 'LOST' } = route.params;
    // const { theme } = useTheme(); // Removed
    const [item, setItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadItem = async () => {
            try {
                let data;
                if (type === 'FOUND') {
                    data = await itemsAPI.getFoundItem(id);
                } else {
                    data = await itemsAPI.getLostItem(id);
                }
                setItem(data);
            } catch (error) {
                console.error('Error loading item:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadItem();
    }, [id, type]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!item) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Item not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{item.title}</Text>

                {/* Status Badge */}
                <View style={[styles.statusBadge, {
                    backgroundColor: STATUS_LABELS[item.status]?.color + '20' || COLORS.grayFaded
                }]}>
                    <Text style={[styles.statusText, {
                        color: STATUS_LABELS[item.status]?.color || COLORS.textSecondary
                    }]}>
                        {STATUS_LABELS[item.status]?.label || item.status}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Description</Text>
                    <Text style={styles.value}>{item.description}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>{type === 'FOUND' ? 'Location Found' : 'Location Lost'}</Text>
                    <Text style={styles.value}>{type === 'FOUND' ? item.location_found : item.location_lost}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>{type === 'FOUND' ? 'Date Found' : 'Date Lost'}</Text>
                    <Text style={styles.value}>{new Date(type === 'FOUND' ? item.date_found : item.date_lost).toLocaleDateString()}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Category</Text>
                    <Text style={styles.value}>{item.category}</Text>
                </View>

                {/* WhatsApp Share Button */}
                <TouchableOpacity
                    style={styles.whatsappButton}
                    onPress={() => {
                        const shareText = `Check out this ${type.toLowerCase()} item on the Lost & Found App: ${item.title}\n\nLocation: ${type === 'FOUND' ? item.location_found : item.location_lost}\nDate: ${new Date(type === 'FOUND' ? item.date_found : item.date_lost).toLocaleDateString()}`;
                        const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
                        
                        if (Platform.OS === 'web') {
                            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
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
                    <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.whatsappButtonText}>Share via WhatsApp</Text>
                </TouchableOpacity>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 24,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        color: COLORS.text,
        lineHeight: 24,
    },
    whatsappButton: {
        flexDirection: 'row',
        backgroundColor: '#25D366',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    whatsappButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 18,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 40,
    },
});
