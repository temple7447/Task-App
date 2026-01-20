import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StorageService } from '@/services/storage-service';
import { ErrorState, LoadingState, Project, Task } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

// Import refactored components
import { EmptyState } from '@/components/tasks/EmptyState';
import { HomeDashboard } from '@/components/tasks/HomeDashboard';
import { SearchBar } from '@/components/tasks/SearchBar';
import { SortFilterOptions } from '@/components/tasks/SortFilterOptions';
import { TaskCard } from '@/components/tasks/TaskCard';

type SortOption = 'dateAdded' | 'status' | 'dueDate';
type FilterOption = 'all' | 'pending' | 'inProgress' | 'completed' | 'cancelled';

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
      loadProjects();
    }, [])
  );

  const checkOnboardingStatus = async () => {
    try {
      const hasCompletedOnboarding = await StorageService.getOnboardingCompleted();
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
        return;
      }
      loadTasks();
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      router.replace('/onboarding');
    }
  };

  const loadTasks = async () => {
    try {
      setLoadingState({ isLoading: true, message: 'Loading your tasks...' });
      setErrorState({ hasError: false });
      const loadedTasks = await StorageService.getTasks();
      setTasks(loadedTasks || []);
      setLoadingState({ isLoading: false });
    } catch (error) {
      console.error('Error loading tasks:', error);
      setErrorState({
        hasError: true,
        message: 'Failed to load tasks.',
        isRecoverable: true,
        type: 'storage',
      });
      setLoadingState({ isLoading: false });
    }
  };

  const loadProjects = async () => {
    try {
      const loadedProjects = await StorageService.getProjects();
      setProjects(loadedProjects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const toggleTaskCheckbox = async (taskId: string, currentChecked: boolean) => {
    try {
      await StorageService.updateTask(taskId, { isChecked: !currentChecked });
      await loadTasks();
    } catch (error) {
      Alert.alert('Update Failed', 'Failed to update task.');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await StorageService.updateTask(taskId, {
        status: newStatus,
        ...(newStatus === 'completed' && { completedAt: new Date() })
      });
      await loadTasks();
    } catch (error) {
      Alert.alert('Update Failed', 'Failed to update task status.');
    }
  };

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
              await loadTasks();
            } catch (error) {
              Alert.alert('Delete Failed', 'Failed to delete task.');
            }
          },
        },
      ]
    );
  };

  const getFilteredAndSortedTasks = (): Task[] => {
    let filtered = tasks.filter(task => {
      const matchesSearch = searchQuery.trim() === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.location && task.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter = filterOption === 'all' || task.status === filterOption;
      return matchesSearch && matchesFilter;
    });

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

  const formatDate = (date: Date): string => {
    try {
      return date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const filteredTasks = getFilteredAndSortedTasks();

  if (errorState.hasError && !errorState.isRecoverable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => checkOnboardingStatus()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Tasks</Text>
        <TouchableOpacity
          style={[styles.headerAddBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/add-task')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <HomeDashboard tasks={tasks} colors={colors} />
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showSortFilter={showSortFilter}
              setShowSortFilter={setShowSortFilter}
              colors={colors}
            />
            {showSortFilter && (
              <SortFilterOptions
                sortOption={sortOption}
                setSortOption={setSortOption}
                filterOption={filterOption}
                setFilterOption={setFilterOption}
                colors={colors}
              />
            )}
          </>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            colors={colors}
            projectName={projects.find(p => p.id === item.projectId)?.name || null}
            onToggleCheckbox={toggleTaskCheckbox}
            onUpdateStatus={updateTaskStatus}
            onDelete={deleteTask}
            formatDate={formatDate}
          />
        )}
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
          <EmptyState
            hasTasks={tasks.length > 0}
            onAddTask={() => router.push('/add-task')}
            colors={colors}
          />
        }
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.placeholder }]}>
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerAddBtn: {
    padding: 10,
    borderRadius: 12,
  },
  taskList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  footer: {
    padding: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
