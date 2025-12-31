/**
 * Projects Screen - Expo Router Implementation
 * 
 * This screen allows users to view, create, edit, and manage their projects.
 * All project data is persisted in AsyncStorage using the StorageService.
 * 
 * Features:
 * - Complete project management interface
 * - Real-time search and filtering by status
 * - CRUD operations with proper error handling
 * - Pull-to-refresh functionality
 * - Modal-based add/edit forms
 * - Status management with visual feedback
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StorageError, StorageService } from '@/services/storage-service';
import { Project, ProjectCollection, ProjectStatus } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
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

type FilterOption = 'all' | ProjectStatus;

interface ProjectWithBalance extends Project {
    remainingBalance?: number;
}

export default function ProjectsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // State management
    const [projects, setProjects] = useState<ProjectWithBalance[]>([]);
    const [collections, setCollections] = useState<ProjectCollection[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState<FilterOption>('all');
    const [showFilter, setShowFilter] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Form states
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formStatus, setFormStatus] = useState<ProjectStatus>('active');
    const [formPrice, setFormPrice] = useState('');
    const [appendPrice, setAppendPrice] = useState('');

    /**
     * Load projects when screen comes into focus
     */
    useFocusEffect(
        useCallback(() => {
            loadProjects();
        }, [])
    );

    /**
     * Loads all projects from storage
     */
    const loadProjects = async () => {
        try {
            setIsLoading(true);
            const [loadedProjects, loadedCollections] = await Promise.all([
                StorageService.getProjects(),
                StorageService.getProjectCollections(),
            ]);

            const projectsWithBalance: ProjectWithBalance[] = loadedProjects.map(project => {
                const projectCollections = loadedCollections.filter(c => c.projectId === project.id);
                const collectedForProject = projectCollections.reduce((sum, c) => sum + c.amount, 0);
                return {
                    ...project,
                    remainingBalance: (project.totalPrice || 0) - collectedForProject
                };
            });

            setProjects(projectsWithBalance);
            setCollections(loadedCollections);
        } catch (error) {
            console.error('Error loading projects:', error);
            Alert.alert(
                'Error',
                error instanceof StorageError ? error.message : 'Failed to load projects'
            );
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
        loadProjects();
    };

    /**
     * Opens add project modal
     */
    const handleAddProject = () => {
        setFormName('');
        setFormDescription('');
        setFormStatus('active');
        setFormPrice('');
        setShowAddModal(true);
    };

    /**
     * Helper to safely parse price strings
     */
    const parsePrice = (val: string) => {
        return parseFloat(val.replace(/,/g, '')) || 0;
    };

    /**
     * Saves new project
     */
    const saveNewProject = async () => {
        if (!formName.trim()) {
            Alert.alert('Validation Error', 'Please enter a project name');
            return;
        }

        try {
            const newProject: Project = {
                id: Date.now().toString(),
                name: formName.trim(),
                description: formDescription.trim(),
                status: formStatus,
                createdAt: new Date(),
                updatedAt: new Date(),
                taskCount: 0,
                totalPrice: parsePrice(formPrice),
            };

            await StorageService.addProject(newProject);
            setShowAddModal(false);
            loadProjects();
            Alert.alert('Success', 'Project created successfully!');
        } catch (error) {
            console.error('Error adding project:', error);
            Alert.alert(
                'Error',
                error instanceof StorageError ? error.message : 'Failed to create project'
            );
        }
    };

    /**
     * Opens edit modal for a project
     */
    const handleEditProject = (project: Project) => {
        setEditingProject(project);
        setFormName(project.name);
        setFormDescription(project.description);
        setFormStatus(project.status);
        setFormPrice(project.totalPrice?.toString() || '');
        setAppendPrice('');
        setShowEditModal(true);
    };

    /**
     * Saves edited project
     */
    const saveEditedProject = async () => {
        if (!editingProject) return;

        if (!formName.trim()) {
            Alert.alert('Validation Error', 'Please enter a project name');
            return;
        }

        try {
            await StorageService.updateProject(editingProject.id, {
                name: formName.trim(),
                description: formDescription.trim(),
                status: formStatus,
                totalPrice: parsePrice(formPrice),
                ...(formStatus === 'completed' && { completedAt: new Date() }),
            });

            setShowEditModal(false);
            setEditingProject(null);
            loadProjects();
            Alert.alert('Success', 'Project updated successfully!');
        } catch (error) {
            console.error('Error updating project:', error);
            Alert.alert(
                'Error',
                error instanceof StorageError ? error.message : 'Failed to update project'
            );
        }
    };

    /**
     * Deletes a project with confirmation
     */
    const deleteProject = (projectId: string, projectName: string) => {
        Alert.alert(
            'Delete Project',
            `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await StorageService.deleteProject(projectId);
                            loadProjects();
                            Alert.alert('Success', 'Project deleted successfully');
                        } catch (error) {
                            console.error('Error deleting project:', error);
                            Alert.alert(
                                'Error',
                                error instanceof StorageError ? error.message : 'Failed to delete project'
                            );
                        }
                    },
                },
            ]
        );
    };

    /**
     * Gets color for project status
     */
    const getStatusColor = (status: ProjectStatus): string => {
        const statusColors = {
            active: colors.primary,
            completed: colors.completed,
            archived: colors.placeholder,
            onHold: colors.warning,
        };
        return statusColors[status];
    };

    /**
     * Gets icon for project status
     */
    const getStatusIcon = (status: ProjectStatus): keyof typeof Ionicons.glyphMap => {
        const statusIcons = {
            active: 'play-circle',
            completed: 'checkmark-circle',
            archived: 'archive',
            onHold: 'pause-circle',
        } as const;
        return statusIcons[status];
    };

    /**
     * Filters and sorts projects
     */
    const getFilteredProjects = (): ProjectWithBalance[] => {
        return projects.filter(project => {
            const matchesSearch = searchQuery.trim() === '' ||
                project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFilter = filterOption === 'all' || project.status === filterOption;

            return matchesSearch && matchesFilter;
        });
    };

    /**
     * Formats date for display
     */
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    /**
     * Renders individual project item
     */
    const renderProjectItem = ({ item: project }: { item: ProjectWithBalance }) => (
        <View style={[styles.projectCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                    <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
                        {project.name}
                    </Text>
                    <View style={styles.statusContainer}>
                        <Ionicons name={getStatusIcon(project.status)} size={16} color={getStatusColor(project.status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Text>
                    </View>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={[styles.priceLabel, { color: colors.placeholder }]}>Total Price</Text>
                    <Text style={[styles.priceAmount, { color: colors.text }]}>₦{(project.totalPrice || 0).toLocaleString()}</Text>

                    <Text style={[styles.priceLabel, { color: colors.placeholder, marginTop: 4 }]}>Remaining</Text>
                    <Text style={[styles.priceAmount, { color: (project.remainingBalance || 0) > 0 ? colors.warning : colors.completed }]}>
                        ₦{(project.remainingBalance || 0).toLocaleString()}
                    </Text>
                </View>

                <View style={styles.projectActions}>
                    <TouchableOpacity onPress={() => handleEditProject(project)} style={styles.actionButton}>
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => deleteProject(project.id, project.name)} style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={[styles.projectDescription, { color: colors.placeholder }]} numberOfLines={2}>
                {project.description || 'No description'}
            </Text>

            <View style={styles.projectMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.placeholder} />
                    <Text style={[styles.metaText, { color: colors.placeholder }]}>
                        {formatDate(project.createdAt)}
                    </Text>
                </View>

                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.placeholder} />
                    <Text style={[styles.metaText, { color: colors.placeholder }]}>
                        Updated {formatDate(project.updatedAt)}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.viewTasksButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                onPress={() => router.push({ pathname: '/project-detail', params: { id: project.id } })}
            >
                <Ionicons name="list-outline" size={16} color={colors.primary} />
                <Text style={[styles.viewTasksText, { color: colors.primary }]}>
                    View Tasks ({project.taskCount || 0})
                </Text>
            </TouchableOpacity>
        </View>
    );

    /**
     * Renders project form modal
     */
    const renderFormModal = (isEdit: boolean) => (
        <Modal
            visible={isEdit ? showEditModal : showAddModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {isEdit ? 'Edit Project' : 'New Project'}
                            </Text>
                            <TouchableOpacity onPress={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.label, { color: colors.text }]}>Project Name *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                placeholder="Enter project name"
                                placeholderTextColor={colors.placeholder}
                                value={formName}
                                onChangeText={setFormName}
                                maxLength={100}
                            />

                            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                placeholder="Enter project description"
                                placeholderTextColor={colors.placeholder}
                                value={formDescription}
                                onChangeText={setFormDescription}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                            />

                            <Text style={[styles.label, { color: colors.text }]}>Total Price (₦)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                placeholder="e.g. 100000"
                                placeholderTextColor={colors.placeholder}
                                value={formPrice}
                                onChangeText={setFormPrice}
                                keyboardType="numeric"
                            />

                            {isEdit && (
                                <View style={[styles.appendRow, { marginTop: 8 }]}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="Add to current price (e.g. 20000)"
                                        placeholderTextColor={colors.placeholder}
                                        value={appendPrice}
                                        onChangeText={setAppendPrice}
                                        keyboardType="numeric"
                                    />
                                    <TouchableOpacity
                                        style={[styles.smallAddButton, { backgroundColor: colors.primary }]}
                                        onPress={() => {
                                            const current = parsePrice(formPrice);
                                            const extra = parsePrice(appendPrice);
                                            setFormPrice((current + extra).toString());
                                            setAppendPrice('');
                                        }}
                                    >
                                        <Ionicons name="add" size={20} color="white" />
                                        <Text style={styles.smallAddButtonText}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <Text style={[styles.label, { color: colors.text }]}>Status</Text>
                            <View style={styles.statusOptions}>
                                {(['active', 'completed', 'archived', 'onHold'] as ProjectStatus[]).map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[
                                            styles.statusOption,
                                            {
                                                backgroundColor: formStatus === status ? getStatusColor(status) : colors.cardBackground,
                                                borderColor: getStatusColor(status)
                                            }
                                        ]}
                                        onPress={() => setFormStatus(status)}
                                    >
                                        <Text style={[
                                            styles.statusOptionText,
                                            { color: formStatus === status ? 'white' : colors.text }
                                        ]}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.cancelButton, { borderColor: colors.border }]}
                                onPress={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={isEdit ? saveEditedProject : saveNewProject}
                            >
                                <Text style={styles.saveButtonText}>{isEdit ? 'Update' : 'Create'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    const filteredProjects = getFilteredProjects();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Projects</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.warning }]}
                        onPress={() => router.push('/(tabs)/project-ideas')}
                    >
                        <Ionicons name="bulb-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={handleAddProject}
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchInput, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Ionicons name="search" size={20} color={colors.placeholder} />
                    <TextInput
                        style={[styles.searchText, { color: colors.text }]}
                        placeholder="Search projects..."
                        placeholderTextColor={colors.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.filterButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                    onPress={() => setShowFilter(!showFilter)}
                >
                    <Ionicons name="options-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Filter Options */}
            {showFilter && (
                <View style={[styles.filterContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by status:</Text>
                    <View style={styles.filterOptions}>
                        {(['all', 'active', 'completed', 'archived', 'onHold'] as FilterOption[]).map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.filterOptionButton,
                                    {
                                        backgroundColor: filterOption === option ? colors.primary : 'transparent',
                                        borderColor: colors.border
                                    }
                                ]}
                                onPress={() => setFilterOption(option)}
                            >
                                <Text style={[
                                    styles.filterOptionText,
                                    { color: filterOption === option ? 'white' : colors.text }
                                ]}>
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Project List */}
            <FlatList
                data={filteredProjects}
                keyExtractor={(item) => item.id}
                renderItem={renderProjectItem}
                contentContainerStyle={styles.projectList}
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
                        <Ionicons
                            name={projects.length === 0 ? "briefcase-outline" : "search-outline"}
                            size={64}
                            color={colors.placeholder}
                        />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {projects.length === 0 ? "No projects yet" : "No matching projects"}
                        </Text>
                        <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
                            {projects.length === 0
                                ? "Create your first project to get started!"
                                : "Try adjusting your search or filters."}
                        </Text>

                        {projects.length === 0 && (
                            <TouchableOpacity
                                style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
                                onPress={handleAddProject}
                            >
                                <Ionicons name="add" size={20} color="white" />
                                <Text style={styles.emptyActionButtonText}>Create First Project</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            {/* Project Count Footer */}
            <View style={styles.projectCount}>
                <Text style={[styles.projectCountText, { color: colors.placeholder }]}>
                    {filteredProjects.length} of {projects.length} projects
                </Text>
            </View>

            {/* Modals */}
            {renderFormModal(false)}
            {renderFormModal(true)}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
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
    filterContainer: {
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterOptionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    filterOptionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    projectList: {
        paddingHorizontal: 16,
        flexGrow: 1,
    },
    projectCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    projectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    projectInfo: {
        flex: 1,
        marginRight: 12,
    },
    projectName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    projectActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    projectDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    projectMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    metaText: {
        fontSize: 12,
        flex: 1,
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
        lineHeight: 22,
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
    projectCount: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    projectCountText: {
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
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
    statusOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    statusOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
    },
    statusOptionText: {
        fontSize: 14,
        fontWeight: '600',
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
    viewTasksButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
        marginTop: 8,
    },
    viewTasksText: {
        fontSize: 14,
        fontWeight: '600',
    },
    priceContainer: {
        alignItems: 'flex-end',
        marginRight: 12,
    },
    priceLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    priceAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    appendRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    smallAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 4,
    },
    smallAddButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
});
