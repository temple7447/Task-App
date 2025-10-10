/**
 * Main Tasks Screen Route - Expo Router Implementation
 * 
 * This is the primary screen of the TaskMaster application where users
 * can view, manage, and interact with their tasks. It includes comprehensive
 * task management functionality with proper error handling and validation.
 * 
 * Features:
 * - Onboarding check on app launch
 * - Complete task management interface
 * - Real-time search and filtering
 * - Status management with visual feedback
 * - Error handling with user-friendly messages
 * - Proper navigation with expo-router
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StorageService, StorageError } from '@/services/storage-service';
import { Task, TaskSortOption, TaskFilterOption, ErrorState, LoadingState } from '@/types/task-types';

// Define sort and filter options for the UI
type SortOption = 'dateAdded' | 'status' | 'dueDate';
type FilterOption = 'all' | 'pending' | 'inProgress' | 'completed' | 'cancelled';

export default function TasksScreen() {
  // Get current color scheme for theming
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Component state management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('dateAdded');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [showSortFilter, setShowSortFilter] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    message: 'Loading tasks...',
  });
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
  });

  /**
   * Check if user has completed onboarding on app launch
   */
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  /**
   * Load tasks when screen comes into focus
   */
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  /**
   * Checks onboarding completion status and redirects if needed
   */
  const checkOnboardingStatus = async () => {
    try {
      const hasCompletedOnboarding = await StorageService.getOnboardingCompleted();
      
      if (!hasCompletedOnboarding) {
        // User hasn't completed onboarding, redirect them
        router.replace('/onboarding');
        return;
      }
      
      // User has completed onboarding, load their tasks
      loadTasks();
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // If we can't check onboarding status, assume they need to complete it
      router.replace('/onboarding');
    }
  };

  /**
   * Loads all tasks from storage with comprehensive error handling
   */
  const loadTasks = async () => {
    try {
      setLoadingState({
        isLoading: true,
        message: 'Loading your tasks...',
      });
      setErrorState({ hasError: false });

      const loadedTasks = await StorageService.getTasks();
      setTasks(loadedTasks);

      setLoadingState({ isLoading: false });
    } catch (error) {
      console.error('Error loading tasks:', error);
      
      let errorMessage = 'Failed to load tasks. Please try again.';
      let isRecoverable = true;
      
      if (error instanceof StorageError) {
        switch (error.type) {
          case 'PERMISSION_DENIED':
            errorMessage = 'Permission denied. Please check app permissions.';
            isRecoverable = false;
            break;
          case 'DATA_CORRUPTION':
            errorMessage = 'Task data appears to be corrupted. You may need to clear app data.';
            isRecoverable = false;
            break;
          case 'PARSE_ERROR':
            errorMessage = 'Error reading task data. Some tasks may not be displayed.';
            break;
          default:
            errorMessage = error.message || errorMessage;
            break;
        }
      }

      setErrorState({
        hasError: true,
        message: errorMessage,
        isRecoverable,
        type: 'storage',
      });
      
      setLoadingState({ isLoading: false });
    }
  };

  /**
   * Updates task status with proper error handling
   */
  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      setLoadingState({
        isLoading: false,
        operations: { updating: true },
      });

      await StorageService.updateTask(taskId, { 
        status: newStatus,
        ...(newStatus === 'completed' && { completedAt: new Date() })
      });

      // Refresh task list
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      
      Alert.alert(
        'Update Failed',
        error instanceof StorageError ? error.message : 'Failed to update task status. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoadingState({ isLoading: false });
    }
  };

  /**
   * Deletes a task with user confirmation
   */
  const deleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoadingState({
                isLoading: false,
                operations: { deleting: true },
              });

              await StorageService.deleteTask(taskId);
              
              // Refresh task list
              await loadTasks();
            } catch (error) {
              console.error('Error deleting task:', error);
              
              Alert.alert(
                'Delete Failed',
                error instanceof StorageError ? error.message : 'Failed to delete task. Please try again.',
                [{ text: 'OK', style: 'default' }]
              );
            } finally {
              setLoadingState({ isLoading: false });
            }
          },
        },
      ]
    );
  };

  /**
   * Navigates to add task screen
   */
  const handleAddTask = () => {
    router.push('/add-task');
  };

  /**
   * Gets appropriate color for task status
   */
  const getStatusColor = (status: Task['status']): string => {
    const statusColors = {
      pending: colors.pending,
      inProgress: colors.inProgress,
      completed: colors.completed,
      cancelled: colors.cancelled,
    };
    return statusColors[status] || colors.placeholder;
  };

  /**
   * Gets appropriate icon for task status
   */
  const getStatusIcon = (status: Task['status']): keyof typeof Ionicons.glyphMap => {
    const statusIcons = {
      pending: 'time-outline',
      inProgress: 'play-circle-outline',
      completed: 'checkmark-circle',
      cancelled: 'close-circle-outline',
    } as const;
    return statusIcons[status] || 'help-circle-outline';
  };

  /**
   * Filters and sorts tasks based on current criteria
   */
  const getFilteredAndSortedTasks = (): Task[] => {
    let filtered = tasks.filter(task => {
      // Apply search filter
      const matchesSearch = searchQuery.trim() === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.location && task.location.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply status filter
      const matchesFilter = filterOption === 'all' || task.status === filterOption;
      
      return matchesSearch && matchesFilter;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'dateAdded':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'dueDate':
          return a.dateTime.getTime() - b.dateTime.getTime();
        default:
          return 0;
      }
    });

    return filtered;
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
   * Gets next status in the workflow
   */
  const getNextStatus = (currentStatus: Task['status']): Task['status'] => {
    const statusFlow = {
      pending: 'inProgress',
      inProgress: 'completed',
      completed: 'pending',
      cancelled: 'pending',
    } as const;
    return statusFlow[currentStatus];
  };

  /**
   * Renders individual task item
   */
  const renderTaskItem = ({ item: task }: { item: Task }) => (
    <TouchableOpacity
      style={[styles.taskCard, { 
        backgroundColor: colors.cardBackground, 
        borderColor: colors.border 
      }]}
      onPress={() => {
        // For now, we'll just show task details in an alert
        // In a full app, this would navigate to a task details screen
        Alert.alert(
          task.title,
          `${task.description}\n\nDue: ${formatDate(task.dateTime)}${
            task.location ? `\nLocation: ${task.location}` : ''
          }\nStatus: ${task.status}\nCreated: ${formatDate(task.createdAt)}`,
          [{ text: 'OK', style: 'default' }]
        );
      }}
      accessibilityLabel={`Task: ${task.title}, Status: ${task.status}`}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={styles.statusContainer}>
            <Ionicons 
              name={getStatusIcon(task.status)} 
              size={16} 
              color={getStatusColor(task.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.taskActions}>
          <TouchableOpacity
            onPress={() => updateTaskStatus(task.id, getNextStatus(task.status))}
            style={styles.actionButton}
            accessibilityLabel={`Mark as ${getNextStatus(task.status)}`}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => deleteTask(task.id, task.title)}
            style={styles.actionButton}
            accessibilityLabel="Delete task"
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.taskDescription, { color: colors.placeholder }]} numberOfLines={2}>
        {task.description}
      </Text>

      <View style={styles.taskMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.placeholder} />
          <Text style={[styles.metaText, { color: colors.placeholder }]}>
            {formatDate(task.dateTime)}
          </Text>
        </View>
        
        {task.location && (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={colors.placeholder} />
            <Text style={[styles.metaText, { color: colors.placeholder }]} numberOfLines={1}>
              {task.location}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Show error state if there's an unrecoverable error
  if (errorState.hasError && !errorState.isRecoverable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
          <Text style={[styles.errorMessage, { color: colors.placeholder }]}>
            {errorState.message}
          </Text>
          
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setErrorState({ hasError: false });
              checkOnboardingStatus();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredTasks = getFilteredAndSortedTasks();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Tasks</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddTask}
          accessibilityLabel="Add new task"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
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
            backgroundColor: colors.cardBackground, 
            borderColor: colors.border 
          }]}
          onPress={() => setShowSortFilter(!showSortFilter)}
          accessibilityLabel="Toggle sort and filter options"
        >
          <Ionicons name="options-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort/Filter Options */}
      {showSortFilter && (
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
      )}

      {/* Error Banner */}
      {errorState.hasError && errorState.isRecoverable && (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}>
          <Ionicons name="warning" size={16} color={colors.error} />
          <Text style={[styles.errorBannerText, { color: colors.error }]}>
            {errorState.message}
          </Text>
        </View>
      )}

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.taskList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingState.isLoading}
            onRefresh={loadTasks}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons 
              name={tasks.length === 0 ? "add-circle-outline" : "search-outline"} 
              size={64} 
              color={colors.placeholder} 
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {tasks.length === 0 ? "No tasks yet" : "No matching tasks"}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
              {tasks.length === 0 
                ? "Create your first task to get started!" 
                : "Try adjusting your search or filters."}
            </Text>
            
            {tasks.length === 0 && (
              <TouchableOpacity
                style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
                onPress={handleAddTask}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.emptyActionButtonText}>Create First Task</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Task Count Footer */}
      <View style={styles.taskCount}>
        <Text style={[styles.taskCountText, { color: colors.placeholder }]}>
          {filteredTasks.length} of {tasks.length} tasks
        </Text>
      </View>
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 14,
    flex: 1,
  },
  taskList: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
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
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  taskMeta: {
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
  taskCount: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  taskCountText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
