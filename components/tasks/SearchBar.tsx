import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showSortFilter: boolean;
    setShowSortFilter: (show: boolean) => void;
    colors: any;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    searchQuery,
    setSearchQuery,
    showSortFilter,
    setShowSortFilter,
    colors,
}) => {
    return (
        <View style={styles.searchContainer}>
            <View style={[styles.searchInput, {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border
            }]}>
                <Ionicons name="search" size={20} color={colors.placeholder} />
                <TextInput
                    style={[styles.searchText, { color: colors.text }]}
                    placeholder="Search tasks..."
                    placeholderTextColor={colors.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <TouchableOpacity
                style={[styles.filterButton, {
                    backgroundColor: showSortFilter ? colors.primary : colors.cardBackground,
                    borderColor: colors.border
                }]}
                onPress={() => setShowSortFilter(!showSortFilter)}
            >
                <Ionicons
                    name="options-outline"
                    size={20}
                    color={showSortFilter ? "white" : colors.primary}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    searchText: {
        flex: 1,
        fontSize: 16,
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
});
