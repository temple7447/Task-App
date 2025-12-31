/**
 * Project Detail Screen - View and Manage Tasks Within a Project
 * 
 * This screen displays a single project's details and all associated tasks.
 * Users can add new tasks directly to the project, check/uncheck tasks,
 * and see task completion statistics.
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StorageService } from '@/services/storage-service';
import { Project, Task } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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

export default function ProjectDetailScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const params = useLocalSearchParams();
    const projectId = params.id as string;

    // State management
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);

    // Form states
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskDateTime, setTaskDateTime] = useState(new Date());

    /**
     * Load project and tasks when screen comes into focus
     */
    useFocusEffect(
        useCallback(() => {
            loadProjectData();
        }, [projectId])
    );

    /**
     * Loads project details and associated tasks
     */
    const loadProjectData = async () => {
        try {
            setIsLoading(true);

            // Load project
            const projects = await StorageService.getProjects();
            const foundProject = projects.find(p => p.id === projectId);

            if (!foundProject) {
                Alert.alert('Error', 'Project not found');
                router.back();
                return;
            }

            setProject(foundProject);

            // Load tasks for this project
            const projectTasks = await StorageService.getTasksByProject(projectId);
            setTasks(projectTasks);

        } catch (error) {
            console.error('Error loading project data:', error);
            Alert.alert('Error', 'Failed to load project details');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    /**
     * Handles pull-to-refresh
     */
    const handleRefresh = () => {
        setIsRefreshing(true);
        loadProjectData();
    };

    /**
     * Toggles task checkbox
     */
    const toggleTaskCheckbox = async (taskId: string, currentChecked: boolean) => {
        try {
            await StorageService.updateTask(taskId, {
                isChecked: !currentChecked
            });
            await loadProjectData();
        } catch (error) {
            console.error('Error toggling task:', error);
            Alert.alert('Error', 'Failed to update task');
        }
    };

    /**
     * Adds new task to this project
     */
    const addTaskToProject = async () => {
        if (!taskTitle.trim()) {
            Alert.alert('Validation Error', 'Please enter a task title');
            return;
        }

        try {
            const newTask: Task = {
                id: Date.now().toString(),
                title: taskTitle.trim(),
                description: taskDescription.trim(),
                dateTime: taskDateTime,
                location: '',
                status: 'pending',
                createdAt: new Date(),
                projectId: projectId,
                isChecked: false,
            };

            await StorageService.addTask(newTask);
            await StorageService.updateProjectTaskCount(projectId);

            setShowAddTaskModal(false);
            setTaskTitle('');
            setTaskDescription('');
            setTaskDateTime(new Date());

            await loadProjectData();
            Alert.alert('Success', 'Task added to project!');
        } catch (error) {
            console.error('Error adding task:', error);
            Alert.alert('Error', 'Failed to add task');
        }
    };

    /**
     * Deletes a task
     */
    const deleteTask = (taskId: string, taskTitle: string) => {
        Alert.alert(
            'Delete Task',
            `Are you sure you want to delete "${taskTitle}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await StorageService.deleteTask(taskId);
                            await StorageService.updateProjectTaskCount(projectId);
                            await loadProjectData();
                            Alert.alert('Success', 'Task deleted');
                        } catch (error) {
                            console.error('Error deleting task:', error);
                            Alert.alert('Error', 'Failed to delete task');
                        }
                    },
                },
            ]
        );
    };

    /**
     * Calculates task completion statistics
     */
    const getTaskStats = () => {
        const total = tasks.length;
        const checked = tasks.filter(t => t.isChecked).length;
        const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
        return { total, checked, percentage };
    };

    /**
     * Formats date for display
     */
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    /**
     * Gets status color
     */
    const getStatusColor = (status: string): string => {
        const statusColors: Record<string, string> = {
            pending: colors.pending || '#FFA500',
            inProgress: colors.inProgress || '#2196F3',
            completed: colors.completed || '#4CAF50',
            cancelled: colors.cancelled || '#F44336',
        };
        return statusColors[status] || colors.placeholder;
    };

    /**
     * Renders individual task item
     */
    const renderTaskItem = ({ item: task }: { item: Task }) => (
        <View style={[styles.taskCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.taskHeader}>
                {/* Checkbox */}
                <TouchableOpacity
                    onPress={() => toggleTaskCheckbox(task.id, task.isChecked)}
                    style={styles.checkbox}
                >
                    <Ionicons
                        name={task.isChecked ? "checkbox" : "square-outline"}
                        size={24}
                        color={task.isChecked ? colors.completed : colors.placeholder}
                    />
                </TouchableOpacity>

                <View style={styles.taskInfo}>
                    <Text
                        style={[
                            styles.taskTitle,
                            { color: colors.text },
                            task.isChecked && styles.taskTitleChecked
                        ]}
                        numberOfLines={1}
                    >
                        {task.title}
                    </Text>

                    <Text
                        style={[
                            styles.taskDescription,
                            { color: colors.placeholder },
                            task.isChecked && styles.taskDescriptionChecked
                        ]}
                        numberOfLines={1}
                    >
                        {task.description || 'No description'}
                    </Text>

                    <Text style={[styles.taskDate, { color: colors.placeholder }]}>
                        {formatDate(task.dateTime)}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => deleteTask(task.id, task.title)}
                    style={styles.deleteButton}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (!project) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
            </SafeAreaView>
        );
    }

    const stats = getTaskStats();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {project.name}
                </Text>

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowAddTaskModal(true)}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Project Info */}
            <View style={[styles.projectInfo, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Text style={[styles.projectDescription, { color: colors.text }]}>
                    {project.description || 'No description'}
                </Text>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total}</Text>
                        <Text style={[styles.statLabel, { color: colors.placeholder }]}>Total Tasks</Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.completed }]}>{stats.checked}</Text>
                        <Text style={[styles.statLabel, { color: colors.placeholder }]}>Completed</Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{stats.percentage}%</Text>
                        <Text style={[styles.statLabel, { color: colors.placeholder }]}>Progress</Text>
                    </View>
                </View>
            </View>

            {/* Task List */}
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={renderTaskItem}
                contentContainerStyle={styles.taskList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="checkbox-outline" size={64} color={colors.placeholder} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No tasks yet</Text>
                        <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
                            Add your first task to this project!
                        </Text>

                        <TouchableOpacity
                            style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowAddTaskModal(true)}
                        >
                            <Ionicons name="add" size={20} color="white" />
                            <Text style={styles.emptyActionButtonText}>Add Task</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Add Task Modal */}
            <Modal
                visible={showAddTaskModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddTaskModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Task</Text>
                                <TouchableOpacity onPress={() => setShowAddTaskModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                <Text style={[styles.label, { color: colors.text }]}>Task Title *</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Enter task title"
                                    placeholderTextColor={colors.placeholder}
                                    value={taskTitle}
                                    onChangeText={setTaskTitle}
                                    maxLength={100}
                                />

                                <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                                <TextInput
                                    style={[styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Enter task description"
                                    placeholderTextColor={colors.placeholder}
                                    value={taskDescription}
                                    onChangeText={setTaskDescription}
                                    multiline
                                    numberOfLines={4}
                                    maxLength={500}
                                />
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={[styles.cancelButton, { borderColor: colors.border }]}
                                    onPress={() => setShowAddTaskModal(false)}
                                >
                                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                    onPress={addTaskToProject}
                                >
                                    <Text style={styles.saveButtonText}>Add Task</Text>
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
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    projectInfo: {
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    projectDescription: {
        fontSize: 16,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    taskList: {
        paddingHorizontal: 16,
        flexGrow: 1,
    },
    taskCard: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkbox: {
        padding: 4,
        marginRight: 12,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    taskDescription: {
        fontSize: 14,
        marginBottom: 4,
    },
    taskDate: {
        fontSize: 12,
    },
    taskTitleChecked: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    taskDescriptionChecked: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    deleteButton: {
        padding: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
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
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    emptyActionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
