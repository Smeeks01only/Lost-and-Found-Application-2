/**
 * Staff Found Items Screen
 * Allows staff to view, create, and manage found items
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
    TextInput,
    Modal,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { itemsAPI } from '../../api';
import { STATUS_LABELS, CATEGORIES, COLORS } from '../../constants';
// import { useTheme } from '../../context/ThemeContext'; // Removed

export default function FoundItemsScreen({ navigation }) {
    // const { theme } = useTheme(); // Removed
    const [foundItems, setFoundItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        category: '',
        location_found: '',
        date_found: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        secret_question: '',
        secret_answer: '',
    });

    const loadFoundItems = useCallback(async () => {
        try {
            const data = await itemsAPI.getFoundItems();
            setFoundItems(data.results || []);
        } catch (error) {
            console.error('Error loading found items:', error);
            Alert.alert('Error', 'Failed to load found items');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadFoundItems();
    }, [loadFoundItems]);

    const onRefresh = () => {
        setIsRefreshing(true);
        loadFoundItems();
    };

    const handleCreateItem = async () => {
        if (!newItem.title || !newItem.category || !newItem.location_found) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            await itemsAPI.createFoundItem(newItem);
            Alert.alert('Success', 'Found item created successfully');
            setShowCreateModal(false);
            setNewItem({
                title: '',
                description: '',
                category: '',
                location_found: '',
                date_found: new Date().toISOString().split('T')[0],
                secret_question: '',
                secret_answer: '',
            });
            loadFoundItems();
        } catch (error) {
            console.error('Error creating found item:', error);
            Alert.alert('Error', 'Failed to create found item');
        }
    };

    const renderFoundItem = ({ item }) => {
        const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: COLORS.textSecondary, fadedBg: COLORS.grayFaded };
        const categoryIcon = CATEGORIES.find(cat => cat.value === item.category)?.icon || 'package-variant';

        return (
            <TouchableOpacity style={styles.itemCard}>
                <View style={styles.itemHeader}>
                    <View style={styles.titleContainer}>
                        <MaterialCommunityIcons name={categoryIcon} size={20} color={COLORS.primary} style={styles.itemIcon} />
                        <Text style={styles.itemTitle}>{item.title}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '25' || COLORS.grayFaded }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color || COLORS.textSecondary }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>
                <Text style={styles.itemClassification}>{item.category} • {new Date(item.date_found).toLocaleDateString()}</Text>
                <View style={styles.locationContainer}>
                    <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.itemLocation}>{item.location_found}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Found Items</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowCreateModal(true)}
                >
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={foundItems}
                renderItem={renderFoundItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="package-variant-closed" size={48} color={COLORS.textLight} style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyTitle}>No Found Items</Text>
                        <Text style={styles.emptySubtitle}>
                            Tap the + button to add a found item
                        </Text>
                    </View>
                }
            />

            {/* Create Found Item Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                            <Text style={styles.cancelButton}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Add Found Item</Text>
                        <TouchableOpacity onPress={handleCreateItem}>
                            <Text style={styles.saveButton}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Title *</Text>
                            <TextInput
                                style={styles.input}
                                value={newItem.title}
                                onChangeText={(text) => setNewItem({ ...newItem, title: text })}
                                placeholder="What was found?"
                                placeholderTextColor={COLORS.textLight}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Category *</Text>
                            <View style={styles.categoryGrid}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.value}
                                        style={[
                                            styles.categoryItem,
                                            newItem.category === cat.value && styles.categoryItemSelected,
                                        ]}
                                        onPress={() => setNewItem({ ...newItem, category: cat.value })}
                                    >
                                        <MaterialCommunityIcons
                                            name={cat.icon}
                                            size={16}
                                            color={newItem.category === cat.value ? COLORS.primary : COLORS.text}
                                            style={styles.categoryIcon}
                                        />
                                        <Text style={[
                                            styles.categoryName,
                                            newItem.category === cat.value && { color: COLORS.primary, fontWeight: '600' }
                                        ]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location Found *</Text>
                            <View style={styles.inputWithIcon}>
                                <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.flexInput}
                                    value={newItem.location_found}
                                    onChangeText={(text) => setNewItem({ ...newItem, location_found: text })}
                                    placeholder="Where was it found?"
                                    placeholderTextColor={COLORS.textLight}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={newItem.description}
                                onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                                placeholder="Describe the item..."
                                placeholderTextColor={COLORS.textLight}
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Secret Question</Text>
                            <TextInput
                                style={styles.input}
                                value={newItem.secret_question}
                                onChangeText={(text) => setNewItem({ ...newItem, secret_question: text })}
                                placeholder="Question only the owner can answer"
                                placeholderTextColor={COLORS.textLight}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Secret Answer</Text>
                            <TextInput
                                style={styles.input}
                                value={newItem.secret_answer}
                                onChangeText={(text) => setNewItem({ ...newItem, secret_answer: text })}
                                placeholder="Expected answer"
                                placeholderTextColor={COLORS.textLight}
                            />
                        </View>
                    </ScrollView>
                </SafeAreaView>
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
    addButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    itemCard: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    itemIcon: {
        marginRight: 8,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
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
    itemClassification: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemLocation: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
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
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    cancelButton: {
        fontSize: 16,
        color: COLORS.error,
    },
    saveButton: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    form: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 20,
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
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    flexInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: COLORS.text,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryItem: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryItemSelected: {
        backgroundColor: COLORS.primaryFaded,
        borderColor: COLORS.primary,
    },
    categoryIcon: {
        marginRight: 4,
    },
    categoryName: {
        fontSize: 14,
        color: COLORS.text,
    },
});
