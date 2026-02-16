/**
 * Report Lost Item Screen
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { itemsAPI } from '../../api';
import { CATEGORIES, COLORS } from '../../constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { useTheme } from '../../context/ThemeContext'; // Removed

export default function ReportLostItemScreen({ navigation }) {
    // const { theme } = useTheme(); // Removed
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        location_lost: '',
        date_lost: new Date().toISOString().split('T')[0],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: null });
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.location_lost.trim()) newErrors.location_lost = 'Location is required';
        if (!formData.date_lost) newErrors.date_lost = 'Date is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            await itemsAPI.createLostItem(formData);
            Alert.alert(
                'Success',
                'Your lost item has been reported. We will notify you when we find potential matches!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error creating item:', error);
            Alert.alert('Error', 'Failed to report item. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedCategory = CATEGORIES.find((c) => c.value === formData.category);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Title */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Item Title *</Text>
                    <TextInput
                        style={[styles.input, errors.title && styles.inputError]}
                        placeholder="e.g., Black Leather Wallet"
                        placeholderTextColor={COLORS.textLight}
                        value={formData.title}
                        onChangeText={(v) => updateField('title', v)}
                    />
                    {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
                </View>

                {/* Category */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Category *</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.picker, errors.category && styles.inputError]}
                        onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                    >
                        {selectedCategory ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons name={selectedCategory.icon} size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.pickerText}>{selectedCategory.label}</Text>
                            </View>
                        ) : (
                            <Text style={styles.placeholderText}>Select a category</Text>
                        )}
                    </TouchableOpacity>
                    {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

                    {showCategoryPicker && (
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.value}
                                    style={[
                                        styles.categoryItem,
                                        formData.category === cat.value && styles.categoryItemSelected,
                                    ]}
                                    onPress={() => {
                                        updateField('category', cat.value);
                                        setShowCategoryPicker(false);
                                    }}
                                >
                                    <MaterialCommunityIcons name={cat.icon} size={28} color={formData.category === cat.value ? COLORS.primary : COLORS.textSecondary} />
                                    <Text
                                        style={[
                                            styles.categoryLabel,
                                            formData.category === cat.value && styles.categoryLabelSelected,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Description */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Description *</Text>
                    <Text style={styles.hint}>
                        Describe your item in detail. Include color, brand, distinguishing features.
                    </Text>
                    <TextInput
                        style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                        placeholder="Describe your lost item..."
                        placeholderTextColor={COLORS.textLight}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={formData.description}
                        onChangeText={(v) => updateField('description', v)}
                    />
                    {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
                </View>

                {/* Location */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Location Lost *</Text>
                    <TextInput
                        style={[styles.input, errors.location_lost && styles.inputError]}
                        placeholder="e.g., Library, Building A, Room 101"
                        placeholderTextColor={COLORS.textLight}
                        value={formData.location_lost}
                        onChangeText={(v) => updateField('location_lost', v)}
                    />
                    {errors.location_lost && <Text style={styles.errorText}>{errors.location_lost}</Text>}
                </View>

                {/* Date */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Date Lost *</Text>
                    <TextInput
                        style={[styles.input, errors.date_lost && styles.inputError]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={COLORS.textLight}
                        value={formData.date_lost}
                        onChangeText={(v) => updateField('date_lost', v)}
                    />
                    {errors.date_lost && <Text style={styles.errorText}>{errors.date_lost}</Text>}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Report Lost Item</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 16,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    hint: {
        fontSize: 12,
        color: COLORS.textSecondary,
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
    inputError: {
        borderColor: COLORS.error,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    picker: {
        justifyContent: 'center',
    },
    pickerText: {
        fontSize: 16,
        color: COLORS.text,
    },
    placeholderText: {
        fontSize: 16,
        color: COLORS.textLight,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: 4,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryItem: {
        width: '33.33%',
        padding: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    categoryItemSelected: {
        backgroundColor: COLORS.primaryFaded,
    },
    categoryIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    categoryLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    categoryLabelSelected: {
        color: COLORS.primary,
        fontWeight: '600',
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
});
