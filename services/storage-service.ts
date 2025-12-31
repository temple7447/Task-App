/**
 * Storage Service - Comprehensive local storage management for TaskMaster
 * 
 * This service provides a centralized way to manage all local storage operations
 * with proper validation, error handling, and data integrity checks.
 * 
 * Features:
 * - Type-safe data operations
 * - Comprehensive error handling
 * - Data validation and sanitization
 * - Backup and recovery mechanisms
 * - Performance optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, ProjectCollection, ProjectIdea, Task } from '../types/task-types';

// Storage keys - centralized for consistency and maintenance
export const STORAGE_KEYS = {
  TASKS: 'taskmaster_tasks',
  PROJECTS: 'taskmaster_projects',
  EARNINGS: 'taskmaster_earnings',
  ONBOARDING_COMPLETED: 'taskmaster_onboarding_completed',
  USER_PREFERENCES: 'taskmaster_user_preferences',
  APP_VERSION: 'taskmaster_app_version',
  PROJECT_COLLECTIONS: 'taskmaster_project_collections',
  PROJECT_IDEAS: 'taskmaster_project_ideas',
} as const;

// Error types for better error handling
export enum StorageErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_FULL = 'STORAGE_FULL',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Custom error class for storage operations
export class StorageError extends Error {
  public readonly type: StorageErrorType;
  public readonly originalError?: Error;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: StorageErrorType = StorageErrorType.UNKNOWN_ERROR,
    originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
    this.type = type;
    this.originalError = originalError;
    this.timestamp = new Date();
  }
}

// User preferences interface
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultSortOption: 'dateAdded' | 'status' | 'dueDate';
  showCompletedTasks: boolean;
  notificationsEnabled: boolean;
  lastBackupDate?: string;
}

// Default user preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  defaultSortOption: 'dateAdded',
  showCompletedTasks: true,
  notificationsEnabled: true,
};

/**
 * Validates if a task object has all required properties and correct types
 * @param task - The task object to validate
 * @returns boolean indicating if the task is valid
 */
function validateTaskObject(task: any): task is Task {
  if (!task || typeof task !== 'object') {
    return false;
  }

  // Check required string properties
  const requiredStrings = ['id', 'title', 'description', 'status'];
  for (const prop of requiredStrings) {
    if (!task[prop] || typeof task[prop] !== 'string') {
      return false;
    }
  }

  // Validate status enum
  const validStatuses = ['pending', 'inProgress', 'completed', 'cancelled'];
  if (!validStatuses.includes(task.status)) {
    return false;
  }

  // Validate dates
  try {
    if (task.dateTime) {
      new Date(task.dateTime);
    }
    if (task.createdAt) {
      new Date(task.createdAt);
    }
  } catch {
    return false;
  }

  // Location is optional but should be string if present
  if (task.location !== undefined && typeof task.location !== 'string') {
    return false;
  }

  return true;
}

/**
 * Sanitizes a task object to ensure data integrity
 * @param task - The task object to sanitize
 * @returns Sanitized task object
 */
function sanitizeTask(task: Task): Task {
  return {
    id: String(task.id).trim(),
    title: String(task.title).trim().substring(0, 100), // Limit title length
    description: String(task.description).trim().substring(0, 500), // Limit description length
    dateTime: new Date(task.dateTime),
    location: task.location ? String(task.location).trim().substring(0, 200) : '', // Limit location length
    status: task.status,
    createdAt: new Date(task.createdAt),
    projectId: task.projectId ? String(task.projectId).trim() : undefined,
    isChecked: Boolean(task.isChecked),
  };
}

/**
 * Validates if a project object has all required properties and correct types
 * @param project - The project object to validate
 * @returns boolean indicating if the project is valid
 */
function validateProjectObject(project: any): project is Project {
  if (!project || typeof project !== 'object') {
    return false;
  }

  // Check required string properties
  const requiredStrings = ['id', 'name', 'description', 'status'];
  for (const prop of requiredStrings) {
    if (!project[prop] || typeof project[prop] !== 'string') {
      return false;
    }
  }

  // Validate status enum
  const validStatuses = ['active', 'completed', 'archived', 'onHold'];
  if (!validStatuses.includes(project.status)) {
    return false;
  }

  // Validate dates
  try {
    if (project.createdAt) {
      new Date(project.createdAt);
    }
    if (project.updatedAt) {
      new Date(project.updatedAt);
    }
  } catch {
    return false;
  }

  // Optional fields validation
  if (project.color !== undefined && typeof project.color !== 'string') {
    return false;
  }

  if (project.tags !== undefined && !Array.isArray(project.tags)) {
    return false;
  }

  if (project.totalPrice !== undefined && typeof project.totalPrice !== 'number') {
    return false;
  }

  return true;
}

/**
 * Sanitizes a project object to ensure data integrity
 * @param project - The project object to sanitize
 * @returns Sanitized project object
 */
function sanitizeProject(project: Project): Project {
  return {
    id: String(project.id).trim(),
    name: String(project.name).trim().substring(0, 100), // Limit name length
    description: String(project.description).trim().substring(0, 500), // Limit description length
    status: project.status,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
    color: project.color ? String(project.color).trim() : undefined,
    tags: project.tags || undefined,
    completedAt: project.completedAt ? new Date(project.completedAt) : undefined,
    taskCount: project.taskCount || 0,
    totalPrice: project.totalPrice || 0,
  };
}

/**
 * Storage Service Class - Main interface for all storage operations
 */
export class StorageService {
  /**
   * Retrieves all tasks from local storage with comprehensive error handling
   * @returns Promise<Task[]> - Array of validated tasks
   */
  static async getTasks(): Promise<Task[]> {
    try {
      // Log operation for debugging
      console.log('[StorageService] Retrieving tasks from local storage');

      const tasksJsonString = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);

      // Handle case where no tasks exist yet
      if (!tasksJsonString) {
        console.log('[StorageService] No tasks found, returning empty array');
        return [];
      }

      // Parse the JSON with error handling
      let parsedTasks: any;
      try {
        parsedTasks = JSON.parse(tasksJsonString);
      } catch (parseError) {
        console.error('[StorageService] JSON parse error:', parseError);
        throw new StorageError(
          'Failed to parse tasks data. Data may be corrupted.',
          StorageErrorType.PARSE_ERROR,
          parseError as Error
        );
      }

      // Validate that parsed data is an array
      if (!Array.isArray(parsedTasks)) {
        throw new StorageError(
          'Invalid tasks data format. Expected array.',
          StorageErrorType.DATA_CORRUPTION
        );
      }

      // Validate and sanitize each task
      const validatedTasks: Task[] = [];
      for (let i = 0; i < parsedTasks.length; i++) {
        const task = parsedTasks[i];

        try {
          // Convert date strings back to Date objects
          if (task.dateTime) {
            task.dateTime = new Date(task.dateTime);
          }
          if (task.createdAt) {
            task.createdAt = new Date(task.createdAt);
          }

          // Validate the task structure
          if (!validateTaskObject(task)) {
            console.warn(`[StorageService] Invalid task at index ${i}, skipping:`, task);
            continue;
          }

          // Sanitize and add to valid tasks
          validatedTasks.push(sanitizeTask(task));
        } catch (taskError) {
          console.warn(`[StorageService] Error processing task at index ${i}:`, taskError);
          // Continue processing other tasks instead of failing completely
          continue;
        }
      }

      console.log(`[StorageService] Successfully retrieved ${validatedTasks.length} valid tasks`);
      return validatedTasks;

    } catch (error) {
      // Handle different types of storage errors
      if (error instanceof StorageError) {
        throw error; // Re-throw our custom errors
      }

      // Handle AsyncStorage specific errors
      if (error instanceof Error) {
        if (error.message.includes('Permission')) {
          throw new StorageError(
            'Permission denied to access local storage',
            StorageErrorType.PERMISSION_DENIED,
            error
          );
        }
        if (error.message.includes('Network')) {
          throw new StorageError(
            'Network error while accessing storage',
            StorageErrorType.NETWORK_ERROR,
            error
          );
        }
      }

      // Generic error fallback
      throw new StorageError(
        'Failed to retrieve tasks from storage',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Saves tasks to local storage with validation and backup
   * @param tasks - Array of tasks to save
   * @returns Promise<void>
   */
  static async saveTasks(tasks: Task[]): Promise<void> {
    try {
      console.log(`[StorageService] Saving ${tasks.length} tasks to local storage`);

      // Validate input
      if (!Array.isArray(tasks)) {
        throw new StorageError(
          'Invalid tasks data: expected array',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      // Validate and sanitize each task
      const validatedTasks = tasks.map((task, index) => {
        if (!validateTaskObject(task)) {
          throw new StorageError(
            `Invalid task at index ${index}: missing required properties`,
            StorageErrorType.VALIDATION_ERROR
          );
        }
        return sanitizeTask(task);
      });

      // Create backup before saving new data
      try {
        const existingTasks = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
        if (existingTasks) {
          await AsyncStorage.setItem(`${STORAGE_KEYS.TASKS}_backup`, existingTasks);
          console.log('[StorageService] Created backup of existing tasks');
        }
      } catch (backupError) {
        console.warn('[StorageService] Failed to create backup:', backupError);
        // Continue with save operation even if backup fails
      }

      // Convert to JSON string
      const tasksJsonString = JSON.stringify(validatedTasks);

      // Check data size to prevent storage overflow
      const dataSize = new Blob([tasksJsonString]).size;
      const maxSize = 5 * 1024 * 1024; // 5MB limit for safety

      if (dataSize > maxSize) {
        throw new StorageError(
          `Data size (${Math.round(dataSize / 1024)}KB) exceeds maximum allowed size`,
          StorageErrorType.STORAGE_FULL
        );
      }

      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, tasksJsonString);

      console.log('[StorageService] Tasks saved successfully');

    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      // Handle specific AsyncStorage errors
      if (error instanceof Error && error.message.includes('quota')) {
        throw new StorageError(
          'Storage quota exceeded. Please delete some tasks to free up space.',
          StorageErrorType.STORAGE_FULL,
          error
        );
      }

      throw new StorageError(
        'Failed to save tasks to storage',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Adds a new task with validation
   * @param task - The task to add
   * @returns Promise<void>
   */
  static async addTask(task: Task): Promise<void> {
    try {
      console.log('[StorageService] Adding new task:', task.title);

      // Validate the new task
      if (!validateTaskObject(task)) {
        throw new StorageError(
          'Invalid task data provided',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      // Get existing tasks
      const existingTasks = await this.getTasks();

      // Check for duplicate IDs
      if (existingTasks.some(existingTask => existingTask.id === task.id)) {
        throw new StorageError(
          'Task with this ID already exists',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      // Add the new task and save
      const updatedTasks = [...existingTasks, sanitizeTask(task)];
      await this.saveTasks(updatedTasks);

      console.log('[StorageService] New task added successfully');

    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        'Failed to add new task',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Updates an existing task
   * @param taskId - ID of the task to update
   * @param updates - Partial task object with updates
   * @returns Promise<void>
   */
  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      console.log('[StorageService] Updating task:', taskId);

      const existingTasks = await this.getTasks();
      const taskIndex = existingTasks.findIndex(task => task.id === taskId);

      if (taskIndex === -1) {
        throw new StorageError(
          'Task not found',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      // Create updated task
      const updatedTask = { ...existingTasks[taskIndex], ...updates };

      // Validate updated task
      if (!validateTaskObject(updatedTask)) {
        throw new StorageError(
          'Updated task data is invalid',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      // Update the tasks array
      existingTasks[taskIndex] = sanitizeTask(updatedTask);
      await this.saveTasks(existingTasks);

      console.log('[StorageService] Task updated successfully');

    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        'Failed to update task',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Deletes a task by ID
   * @param taskId - ID of the task to delete
   * @returns Promise<void>
   */
  static async deleteTask(taskId: string): Promise<void> {
    try {
      console.log('[StorageService] Deleting task:', taskId);

      const existingTasks = await this.getTasks();
      const filteredTasks = existingTasks.filter(task => task.id !== taskId);

      if (filteredTasks.length === existingTasks.length) {
        throw new StorageError(
          'Task not found',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      await this.saveTasks(filteredTasks);
      console.log('[StorageService] Task deleted successfully');

    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        'Failed to delete task',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Gets onboarding completion status
   * @returns Promise<boolean>
   */
  static async getOnboardingCompleted(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return value === 'true';
    } catch (error) {
      console.error('[StorageService] Error getting onboarding status:', error);
      return false; // Default to not completed if error occurs
    }
  }

  /**
   * Sets onboarding completion status
   * @param completed - Whether onboarding is completed
   * @returns Promise<void>
   */
  static async setOnboardingCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed.toString());
    } catch (error) {
      throw new StorageError(
        'Failed to save onboarding status',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Gets user preferences with defaults
   * @returns Promise<UserPreferences>
   */
  static async getUserPreferences(): Promise<UserPreferences> {
    try {
      const prefsJsonString = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);

      if (!prefsJsonString) {
        return DEFAULT_PREFERENCES;
      }

      const storedPrefs = JSON.parse(prefsJsonString);
      return { ...DEFAULT_PREFERENCES, ...storedPrefs };

    } catch (error) {
      console.error('[StorageService] Error loading preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Saves user preferences
   * @param preferences - User preferences to save
   * @returns Promise<void>
   */
  static async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const currentPrefs = await this.getUserPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(updatedPrefs)
      );
    } catch (error) {
      throw new StorageError(
        'Failed to save user preferences',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Clears all application data
   * @returns Promise<void>
   */
  static async clearAllData(): Promise<void> {
    try {
      console.log('[StorageService] Clearing all application data');

      const keysToRemove = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keysToRemove);

      console.log('[StorageService] All data cleared successfully');

    } catch (error) {
      throw new StorageError(
        'Failed to clear application data',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Exports all data for backup purposes
   * @returns Promise<string> - JSON string of all data
   */
  static async exportData(): Promise<string> {
    try {
      const [tasks, onboardingCompleted, preferences] = await Promise.all([
        this.getTasks(),
        this.getOnboardingCompleted(),
        this.getUserPreferences(),
      ]);

      const exportData = {
        tasks,
        onboardingCompleted,
        preferences,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
      };

      return JSON.stringify(exportData, null, 2);

    } catch (error) {
      throw new StorageError(
        'Failed to export data',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * ============================================================================
   * PROJECT MANAGEMENT METHODS
   * ============================================================================
   */

  /**
   * Retrieves all projects from local storage with comprehensive error handling
   * @returns Promise<Project[]> - Array of validated projects
   */
  static async getProjects(): Promise<Project[]> {
    try {
      console.log('[StorageService] Retrieving projects from local storage');

      const projectsJsonString = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);

      if (!projectsJsonString) {
        console.log('[StorageService] No projects found, returning empty array');
        return [];
      }

      let parsedProjects: any;
      try {
        parsedProjects = JSON.parse(projectsJsonString);
      } catch (parseError) {
        console.error('[StorageService] JSON parse error:', parseError);
        throw new StorageError(
          'Failed to parse projects data. Data may be corrupted.',
          StorageErrorType.PARSE_ERROR,
          parseError as Error
        );
      }

      if (!Array.isArray(parsedProjects)) {
        throw new StorageError(
          'Invalid projects data format. Expected array.',
          StorageErrorType.DATA_CORRUPTION
        );
      }

      const validatedProjects: Project[] = [];
      for (let i = 0; i < parsedProjects.length; i++) {
        const project = parsedProjects[i];

        try {
          // Convert date strings back to Date objects
          if (project.createdAt) {
            project.createdAt = new Date(project.createdAt);
          }
          if (project.updatedAt) {
            project.updatedAt = new Date(project.updatedAt);
          }
          if (project.completedAt) {
            project.completedAt = new Date(project.completedAt);
          }

          if (!validateProjectObject(project)) {
            console.warn(`[StorageService] Invalid project at index ${i}, skipping:`, project);
            continue;
          }

          validatedProjects.push(sanitizeProject(project));
        } catch (projectError) {
          console.warn(`[StorageService] Error processing project at index ${i}:`, projectError);
          continue;
        }
      }

      console.log(`[StorageService] Successfully retrieved ${validatedProjects.length} valid projects`);
      return validatedProjects;

    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('Permission')) {
          throw new StorageError(
            'Permission denied to access local storage',
            StorageErrorType.PERMISSION_DENIED,
            error
          );
        }
      }

      throw new StorageError(
        'Failed to retrieve projects from storage',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Saves projects to local storage with validation and backup
   * @param projects - Array of projects to save
   * @returns Promise<void>
   */
  static async saveProjects(projects: Project[]): Promise<void> {
    try {
      console.log(`[StorageService] Saving ${projects.length} projects to local storage`);

      if (!Array.isArray(projects)) {
        throw new StorageError(
          'Invalid projects data: expected array',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      const validatedProjects = projects.map((project, index) => {
        if (!validateProjectObject(project)) {
          throw new StorageError(
            `Invalid project at index ${index}: missing required properties`,
            StorageErrorType.VALIDATION_ERROR
          );
        }
        return sanitizeProject(project);
      });

      // Create backup before saving new data
      try {
        const existingProjects = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (existingProjects) {
          await AsyncStorage.setItem(`${STORAGE_KEYS.PROJECTS}_backup`, existingProjects);
          console.log('[StorageService] Created backup of existing projects');
        }
      } catch (backupError) {
        console.warn('[StorageService] Failed to create backup:', backupError);
      }

      const projectsJsonString = JSON.stringify(validatedProjects);

      // Check data size
      const dataSize = new Blob([projectsJsonString]).size;
      const maxSize = 5 * 1024 * 1024; // 5MB limit

      if (dataSize > maxSize) {
        throw new StorageError(
          `Data size (${Math.round(dataSize / 1024)}KB) exceeds maximum allowed size`,
          StorageErrorType.STORAGE_FULL
        );
      }

      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, projectsJsonString);
      console.log('[StorageService] Projects saved successfully');

    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      if (error instanceof Error && error.message.includes('quota')) {
        throw new StorageError(
          'Storage quota exceeded. Please delete some projects to free up space.',
          StorageErrorType.STORAGE_FULL,
          error
        );
      }

      throw new StorageError(
        'Failed to save projects to storage',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Adds a new project with validation
   * @param project - The project to add
   * @returns Promise<void>
   */
  static async addProject(project: Project): Promise<void> {
    try {
      console.log('[StorageService] Adding new project:', project.name);

      if (!validateProjectObject(project)) {
        throw new StorageError(
          'Invalid project data provided',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      const existingProjects = await this.getProjects();

      if (existingProjects.some(existingProject => existingProject.id === project.id)) {
        throw new StorageError(
          'Project with this ID already exists',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      const updatedProjects = [...existingProjects, sanitizeProject(project)];
      await this.saveProjects(updatedProjects);

      console.log('[StorageService] New project added successfully');

    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        'Failed to add new project',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Updates an existing project
   * @param projectId - ID of the project to update
   * @param updates - Partial project object with updates
   * @returns Promise<void>
   */
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      console.log('[StorageService] Updating project:', projectId);

      const existingProjects = await this.getProjects();
      const projectIndex = existingProjects.findIndex(project => project.id === projectId);

      if (projectIndex === -1) {
        throw new StorageError(
          'Project not found',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      // Create updated project with updatedAt timestamp
      const updatedProject = {
        ...existingProjects[projectIndex],
        ...updates,
        updatedAt: new Date()
      };

      if (!validateProjectObject(updatedProject)) {
        throw new StorageError(
          'Updated project data is invalid',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      existingProjects[projectIndex] = sanitizeProject(updatedProject);
      await this.saveProjects(existingProjects);

      console.log('[StorageService] Project updated successfully');

    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        'Failed to update project',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Deletes a project by ID
   * @param projectId - ID of the project to delete
   * @returns Promise<void>
   */
  static async deleteProject(projectId: string): Promise<void> {
    try {
      console.log('[StorageService] Deleting project:', projectId);

      const existingProjects = await this.getProjects();
      const filteredProjects = existingProjects.filter(project => project.id !== projectId);

      if (filteredProjects.length === existingProjects.length) {
        throw new StorageError(
          'Project not found',
          StorageErrorType.VALIDATION_ERROR
        );
      }

      await this.saveProjects(filteredProjects);
      console.log('[StorageService] Project deleted successfully');

    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        'Failed to delete project',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * Gets all tasks for a specific project
   * @param projectId - ID of the project
   * @returns Promise<Task[]> - Array of tasks for the project
   */
  static async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const allTasks = await this.getTasks();
      return allTasks.filter(task => task.projectId === projectId);
    } catch (error) {
      throw new StorageError(
        'Failed to retrieve tasks by project',
        StorageErrorType.UNKNOWN_ERROR,
        error as Error
      );
    }
  }

  /**
   * ============================================================================
   * PROJECT COLLECTIONS & IDEAS
   * ============================================================================
   */

  static async getProjectCollections(): Promise<ProjectCollection[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROJECT_COLLECTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      throw new StorageError('Failed to get collections', StorageErrorType.UNKNOWN_ERROR);
    }
  }

  static async addProjectCollection(collection: ProjectCollection): Promise<void> {
    try {
      const existing = await this.getProjectCollections();
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECT_COLLECTIONS, JSON.stringify([...existing, collection]));
    } catch (error) {
      throw new StorageError('Failed to add collection', StorageErrorType.UNKNOWN_ERROR);
    }
  }

  static async deleteProjectCollection(id: string): Promise<void> {
    try {
      const existing = await this.getProjectCollections();
      const filtered = existing.filter(c => c.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECT_COLLECTIONS, JSON.stringify(filtered));
    } catch (error) {
      throw new StorageError('Failed to delete collection', StorageErrorType.UNKNOWN_ERROR);
    }
  }

  static async getProjectIdeas(): Promise<ProjectIdea[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROJECT_IDEAS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      throw new StorageError('Failed to get ideas', StorageErrorType.UNKNOWN_ERROR);
    }
  }

  static async addProjectIdea(idea: ProjectIdea): Promise<void> {
    try {
      const existing = await this.getProjectIdeas();
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECT_IDEAS, JSON.stringify([...existing, idea]));
    } catch (error) {
      throw new StorageError('Failed to add idea', StorageErrorType.UNKNOWN_ERROR);
    }
  }

  static async deleteProjectIdea(id: string): Promise<void> {
    try {
      const existing = await this.getProjectIdeas();
      const filtered = existing.filter(i => i.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECT_IDEAS, JSON.stringify(filtered));
    } catch (error) {
      throw new StorageError('Failed to delete idea', StorageErrorType.UNKNOWN_ERROR);
    }
  }

  /**
   * Updates the task count for a project
   * @param projectId - ID of the project to update
   * @returns Promise<void>
   */
  static async updateProjectTaskCount(projectId: string): Promise<void> {
    try {
      const tasks = await this.getTasksByProject(projectId);
      const taskCount = tasks.length;

      await this.updateProject(projectId, { taskCount });
    } catch (error) {
      console.warn('[StorageService] Failed to update project task count:', error);
      // Don't throw error - this is a non-critical operation
    }
  }
}