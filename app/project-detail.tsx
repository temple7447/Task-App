/**
 * Project Detail Screen - View and Manage Tasks Within a Project
 * 
 * This screen displays a single project's details and all associated tasks.
 * Uses modular components for better maintainability.
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
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import modular components
import { AddProjectTaskModal } from '@/components/projects/AddProjectTaskModal';
import { AddSubscriptionModal } from '@/components/projects/AddSubscriptionModal';
import { ProjectInfo } from '@/components/projects/ProjectInfo';
import { ProjectTaskItem } from '@/components/projects/ProjectTaskItem';
import { SubscriptionSection } from '@/components/projects/SubscriptionSection';

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
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);

  // Form states for tasks
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDateTime, setTaskDateTime] = useState(new Date());

  // Form states for subscriptions
  const [subName, setSubName] = useState('');
  const [subStartDate, setSubStartDate] = useState(new Date());
  const [subEndDate, setSubEndDate] = useState(new Date());
  const [subCost, setSubCost] = useState('');

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

      const projects = await StorageService.getProjects();
      const foundProject = projects.find(p => p.id === projectId);

      if (!foundProject) {
        Alert.alert('Error', 'Project not found');
        router.back();
        return;
      }

      setProject(foundProject);

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
   * Adds new subscription to this project
   */
  const addSubscriptionToProject = async () => {
    if (!subName.trim() || !subStartDate || !subEndDate) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (subEndDate <= subStartDate) {
      Alert.alert('Validation Error', 'End date must be after start date');
      return;
    }

    try {
      const newSubscription = {
        id: Date.now().toString(),
        name: subName.trim(),
        startDate: subStartDate,
        endDate: subEndDate,
        cost: subCost ? Number(subCost) : undefined,
        status: 'active' as const,
      };

      const updatedProject = {
        ...project!,
        subscriptions: [...(project!.subscriptions || []), newSubscription],
        updatedAt: new Date(),
      };

      await StorageService.updateProject(projectId, updatedProject);
      
      setShowAddSubscriptionModal(false);
      setSubName('');
      setSubCost('');
      setSubStartDate(new Date());
      setSubEndDate(new Date());

      await loadProjectData();
      Alert.alert('Success', 'Subscription added!');
    } catch (error) {
      console.error('Error adding subscription:', error);
      Alert.alert('Error', 'Failed to add subscription');
    }
  };

  /**
   * Deletes a subscription
   */
  const deleteSubscription = async (subId: string) => {
    Alert.alert(
      'Delete Subscription',
      'Are you sure you want to delete this subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedProject = {
                ...project!,
                subscriptions: project!.subscriptions?.filter(s => s.id !== subId),
                updatedAt: new Date(),
              };
              await StorageService.updateProject(projectId, updatedProject);
              await loadProjectData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete subscription');
            }
          },
        },
      ]
    );
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

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <ProjectInfo 
              description={project.description} 
              stats={stats} 
              colors={colors} 
            />
            
            <SubscriptionSection 
              subscriptions={project.subscriptions}
              colors={colors}
              onAddSub={() => setShowAddSubscriptionModal(true)}
              onDeleteSub={deleteSubscription}
            />

            <View style={styles.taskListHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Tasks</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <ProjectTaskItem
            task={item}
            colors={colors}
            onToggle={toggleTaskCheckbox}
            onDelete={deleteTask}
            formatDate={formatDate}
          />
        )}
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

      <AddProjectTaskModal
        visible={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSave={addTaskToProject}
        colors={colors}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskDescription={taskDescription}
        setTaskDescription={setTaskDescription}
      />

      <AddSubscriptionModal
        visible={showAddSubscriptionModal}
        onClose={() => setShowAddSubscriptionModal(false)}
        onSave={addSubscriptionToProject}
        colors={colors}
        subName={subName}
        setSubName={setSubName}
        subCost={subCost}
        setSubCost={setSubCost}
        subStartDate={subStartDate}
        setSubStartDate={setSubStartDate}
        subEndDate={subEndDate}
        setSubEndDate={setSubEndDate}
      />
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
  taskListHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskList: {
    paddingHorizontal: 16,
    flexGrow: 1,
    paddingBottom: 20,
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
});
