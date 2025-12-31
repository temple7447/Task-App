/**
 * Project Ideas Screen - Track future project concepts
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StorageService } from '@/services/storage-service';
import { ProjectIdea, TaskPriority } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProjectIdeasScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // State
    const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');

    useFocusEffect(
        useCallback(() => {
            loadIdeas();
        }, [])
    );

    const loadIdeas = async () => {
        try {
            setIsLoading(true);
            const loadedIdeas = await StorageService.getProjectIdeas();
            setIdeas(loadedIdeas);
        } catch (error) {
            console.error('Error loading ideas:', error);
            Alert.alert('Error', 'Failed to load project ideas');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleSaveIdea = async () => {
        if (!title.trim()) {
            Alert.alert('Validation Error', 'Please enter an idea title');
            return;
        }

        try {
            const newIdea: ProjectIdea = {
                id: Date.now().toString(),
                title: title.trim(),
                description: description.trim(),
                priority,
                isConverted: false,
                createdAt: new Date(),
            };

            await StorageService.addProjectIdea(newIdea);
            setShowAddModal(false);
            setTitle('');
            setDescription('');
            setPriority('medium');
            loadIdeas();
            Alert.alert('Success', 'Project idea saved');
        } catch (error) {
            Alert.alert('Error', 'Failed to save idea');
        }
    };

    const deleteIdea = (id: string) => {
        Alert.alert('Delete Idea', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await StorageService.deleteProjectIdea(id);
                        loadIdeas();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete idea');
                    }
                },
            },
        ]);
    };

    const getPriorityColor = (p: TaskPriority) => {
        switch (p) {
            case 'urgent': return colors.error;
            case 'high': return colors.warning;
            case 'medium': return colors.primary;
            default: return colors.placeholder;
        }
    };

    const renderIdeaItem = ({ item }: { item: ProjectIdea }) => (
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={styles.titleArea}>
                    <Text style={[styles.ideaTitle, { color: colors.text }]}>{item.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                            {item.priority.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => deleteIdea(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
            </View>
            {item.description && (
                <Text style={[styles.description, { color: colors.placeholder }]}>{item.description}</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Project Ideas</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={ideas}
                keyExtractor={(item) => item.id}
                renderItem={renderIdeaItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => {
                            setIsRefreshing(true);
                            loadIdeas();
                        }}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="bulb-outline" size={64} color={colors.placeholder} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No ideas yet</Text>
                        <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
                            Capture your next big project idea here!
                        </Text>
                    </View>
                }
            />

            <Modal visible={showAddModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>New Idea</Text>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                    placeholder="What's the idea?"
                                    value={title}
                                    onChangeText={setTitle}
                                />

                                <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                                <TextInput
                                    style={[styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Describe it..."
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={4}
                                />

                                <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
                                <View style={styles.priorityOptions}>
                                    {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[
                                                styles.priorityOption,
                                                {
                                                    backgroundColor: priority === p ? getPriorityColor(p) : colors.cardBackground,
                                                    borderColor: getPriorityColor(p)
                                                }
                                            ]}
                                            onPress={() => setPriority(p)}
                                        >
                                            <Text style={{ color: priority === p ? 'white' : colors.text }}>
                                                {p.charAt(0).toUpperCase() + p.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                    onPress={handleSaveIdea}
                                >
                                    <Text style={styles.saveButtonText}>Save Idea</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20 },
    card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    titleArea: { flex: 1 },
    ideaTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
    priorityText: { fontSize: 10, fontWeight: 'bold' },
    description: { fontSize: 14, marginTop: 8, lineHeight: 20 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
    emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16 },
    emptyDescription: { fontSize: 16, textAlign: 'center', marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalBody: { padding: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14 },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 120, textAlignVertical: 'top' },
    priorityOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    priorityOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    modalFooter: { padding: 20 },
    saveButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
