import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EmptyStateProps {
    hasTasks: boolean;
    onAddTask: () => void;
    colors: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ hasTasks, onAddTask, colors }) => {
    return (
        <View style={styles.emptyState}>
            <Ionicons
                name={!hasTasks ? "add-circle-outline" : "search-outline"}
                size={64}
                color={colors.placeholder}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {!hasTasks ? "No tasks yet" : "No matching tasks"}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
                {!hasTasks
                    ? "Create your first task to get started!"
                    : "Try adjusting your search or filters."}
            </Text>

            {!hasTasks && (
                <TouchableOpacity
                    style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
                    onPress={onAddTask}
                >
                    <Ionicons name="add" size={20} color="white" />
                    <Text style={styles.emptyActionButtonText}>Create First Task</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    emptyState: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    emptyActionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
