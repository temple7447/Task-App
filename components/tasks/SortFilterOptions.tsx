import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type SortOption = 'dateAdded' | 'status' | 'dueDate';
type FilterOption = 'all' | 'pending' | 'inProgress' | 'completed' | 'cancelled';

interface SortFilterOptionsProps {
    sortOption: SortOption;
    setSortOption: (option: SortOption) => void;
    filterOption: FilterOption;
    setFilterOption: (option: FilterOption) => void;
    colors: any;
}

export const SortFilterOptions: React.FC<SortFilterOptionsProps> = ({
    sortOption,
    setSortOption,
    filterOption,
    setFilterOption,
    colors,
}) => {
    return (
        <View style={[styles.sortFilterContainer, {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border
        }]}>
            <View style={styles.sortFilterSection}>
                <Text style={[styles.sortFilterTitle, { color: colors.text }]}>Sort by:</Text>
                <View style={styles.optionsRow}>
                    {(['dateAdded', 'status', 'dueDate'] as SortOption[]).map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.optionButton,
                                {
                                    backgroundColor: sortOption === option ? colors.primary : 'transparent',
                                    borderColor: colors.border
                                }
                            ]}
                            onPress={() => setSortOption(option)}
                        >
                            <Text style={[
                                styles.optionText,
                                { color: sortOption === option ? 'white' : colors.text }
                            ]}>
                                {option === 'dateAdded' ? 'Date Added' :
                                    option === 'dueDate' ? 'Due Date' : 'Status'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.sortFilterSection}>
                <Text style={[styles.sortFilterTitle, { color: colors.text }]}>Filter by:</Text>
                <View style={styles.optionsRow}>
                    {(['all', 'pending', 'inProgress', 'completed', 'cancelled'] as FilterOption[]).map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.optionButton,
                                {
                                    backgroundColor: filterOption === option ? colors.primary : 'transparent',
                                    borderColor: colors.border
                                }
                            ]}
                            onPress={() => setFilterOption(option)}
                        >
                            <Text style={[
                                styles.optionText,
                                { color: filterOption === option ? 'white' : colors.text }
                            ]}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sortFilterContainer: {
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    sortFilterSection: {
        marginBottom: 12,
    },
    sortFilterTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
