/**
 * Collections Screen - Record money collected on projects
 * 
 * Features:
 * - Record income against specific projects
 * - View collection history
 * - Filter by project
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StorageService } from '@/services/storage-service';
import { Project, ProjectCollection } from '@/types/task-types';
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

export default function CollectionsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // State
    const [collections, setCollections] = useState<ProjectCollection[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form states
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [showProjectPicker, setShowProjectPicker] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // Sync selected project if projects list updates
    React.useEffect(() => {
        if (selectedProject) {
            const updated = projects.find(p => p.id === selectedProject.id);
            if (updated) {
                setSelectedProject(updated);
            }
        }
    }, [projects]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [loadedCollections, loadedProjects] = await Promise.all([
                StorageService.getProjectCollections(),
                StorageService.getProjects(),
            ]);
            setCollections(loadedCollections);
            setProjects(loadedProjects);
        } catch (error) {
            console.error('Error loading collections:', error);
            Alert.alert('Error', 'Failed to load collections');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleSaveCollection = async () => {
        if (!selectedProject || !amount || isNaN(parseFloat(amount))) {
            Alert.alert('Invalid Input', 'Please select a project and enter a valid amount');
            return;
        }

        try {
            const newCollection: ProjectCollection = {
                id: Date.now().toString(),
                projectId: selectedProject.id,
                projectName: selectedProject.name,
                amount: parseFloat(amount),
                date: new Date(),
                notes: notes.trim(),
                createdAt: new Date(),
            };

            await StorageService.addProjectCollection(newCollection);
            setShowAddModal(false);
            setAmount('');
            setNotes('');
            setSelectedProject(null);
            loadData();
            Alert.alert('Success', 'Collection recorded successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to save collection');
        }
    };

    const deleteCollection = (id: string, projectName: string, amount: number) => {
        Alert.alert(
            'Delete Collection',
            `Are you sure you want to delete this collection of ${formatCurrency(amount)} for "${projectName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await StorageService.deleteProjectCollection(id);
                            loadData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete collection');
                        }
                    },
                },
            ]
        );
    };

    const formatCurrency = (amount: number): string => {
        return `₦${amount.toLocaleString()}`;
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const renderCollectionItem = ({ item }: { item: ProjectCollection }) => (
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.projectName, { color: colors.text }]}>{item.projectName}</Text>
                            <Text style={[styles.date, { color: colors.placeholder }]}>{formatDate(new Date(item.date))}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => deleteCollection(item.id, item.projectName, item.amount)}
                            style={{ padding: 4 }}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.amount, { color: colors.completed, marginTop: 8 }]}>{formatCurrency(item.amount)}</Text>
                </View>
            </View>
            {item.notes && (
                <Text style={[styles.notes, { color: colors.placeholder }]}>{item.notes}</Text>
            )}
        </View>
    );

    const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);

    const getProjectCollections = (projectId: string) => {
        return collections.filter(c => c.projectId === projectId);
    };

    const getRemainingBalance = (project: Project | null) => {
        if (!project) return 0;
        const projectCollections = getProjectCollections(project.id);
        const collectedForProject = projectCollections.reduce((sum, c) => sum + c.amount, 0);
        return (project.totalPrice || 0) - collectedForProject;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Collections</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
                        Total: {formatCurrency(totalCollected)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={collections}
                keyExtractor={(item) => item.id}
                renderItem={renderCollectionItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => {
                            setIsRefreshing(true);
                            loadData();
                        }}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="wallet-outline" size={64} color={colors.placeholder} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No collections yet</Text>
                        <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
                            Record money collected on your projects here.
                        </Text>
                    </View>
                }
            />

            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Record Collection</Text>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                <Text style={[styles.label, { color: colors.text }]}>Project *</Text>
                                <TouchableOpacity
                                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                    onPress={() => setShowProjectPicker(true)}
                                >
                                    <Text style={{ color: selectedProject ? colors.text : colors.placeholder }}>
                                        {selectedProject ? selectedProject.name : 'Select Project'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color={colors.placeholder} />
                                </TouchableOpacity>

                                {selectedProject && (
                                    <View style={[styles.balanceBanner, { backgroundColor: colors.primary + '10' }]}>
                                        <View>
                                            <Text style={[styles.balanceLabel, { color: colors.placeholder }]}>Project Price</Text>
                                            <Text style={[styles.balanceValue, { color: colors.text }]}>₦{(selectedProject.totalPrice || 0).toLocaleString()}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.balanceLabel, { color: colors.placeholder }]}>Remaining Balance</Text>
                                            <Text style={[styles.balanceValue, { color: getRemainingBalance(selectedProject) > 0 ? colors.warning : colors.completed }]}>
                                                ₦{getRemainingBalance(selectedProject).toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                <Text style={[styles.label, { color: colors.text }]}>Amount (₦) *</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Enter amount"
                                    placeholderTextColor={colors.placeholder}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                />

                                <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
                                <TextInput
                                    style={[styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Optional notes..."
                                    placeholderTextColor={colors.placeholder}
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    numberOfLines={3}
                                />
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                    onPress={handleSaveCollection}
                                >
                                    <Text style={styles.saveButtonText}>Record Collection</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Project Picker Modal */}
                    <Modal visible={showProjectPicker} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.pickerContent, { backgroundColor: colors.cardBackground }]}>
                                <Text style={[styles.modalTitle, { color: colors.text, padding: 20 }]}>Select Project</Text>
                                <ScrollView>
                                    {projects.map((p) => (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={styles.pickerItem}
                                            onPress={() => {
                                                setSelectedProject(p);
                                                setShowProjectPicker(false);
                                            }}
                                        >
                                            <Text style={{ color: colors.text }}>{p.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    {projects.length === 0 && (
                                        <Text style={{ textAlign: 'center', padding: 20, color: colors.placeholder }}>
                                            No active projects found
                                        </Text>
                                    )}
                                </ScrollView>
                                <TouchableOpacity
                                    style={[styles.cancelButton, { padding: 20 }]}
                                    onPress={() => setShowProjectPicker(false)}
                                >
                                    <Text style={{ color: colors.error, textAlign: 'center' }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 16, marginTop: 4 },
    addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20 },
    card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    projectName: { fontSize: 18, fontWeight: '600' },
    date: { fontSize: 14, marginTop: 4 },
    amount: { fontSize: 18, fontWeight: 'bold' },
    notes: { fontSize: 14, marginTop: 8, fontStyle: 'italic' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
    emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16 },
    emptyDescription: { fontSize: 16, textAlign: 'center', marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalBody: { padding: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    input: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14 },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 100, textAlignVertical: 'top' },
    modalFooter: { padding: 20 },
    saveButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    pickerContent: { margin: 20, borderRadius: 12, maxHeight: '60%' },
    pickerItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    cancelButton: { borderTopWidth: 1, borderTopColor: '#eee' },
    balanceBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
    },
    balanceLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
    },
    balanceValue: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 2,
    },
});
