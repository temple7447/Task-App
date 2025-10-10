/**
 * Type Definitions for TaskMaster Application
 * 
 * This file contains all the TypeScript type definitions used throughout
 * the application to ensure type safety and better development experience.
 */

// Task status enumeration with clear, meaningful values
export type TaskStatus = 'pending' | 'inProgress' | 'completed' | 'cancelled';

// Priority levels for future enhancement
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Main Task interface representing a single task in the system
 * All fields are required except location which is optional
 */
export interface Task {
  /** Unique identifier for the task */
  id: string;
  
  /** Task title - limited to 100 characters */
  title: string;
  
  /** Detailed description of the task - limited to 500 characters */
  description: string;
  
  /** When the task should be completed */
  dateTime: Date;
  
  /** Optional location for the task - limited to 200 characters */
  location?: string;
  
  /** Current status of the task */
  status: TaskStatus;
  
  /** When the task was created */
  createdAt: Date;
  
  /** Optional priority level for future use */
  priority?: TaskPriority;
  
  /** Optional tags for categorization */
  tags?: string[];
  
  /** Optional estimated duration in minutes */
  estimatedDuration?: number;
  
  /** Optional completion date when status becomes 'completed' */
  completedAt?: Date;
}

/**
 * Interface for creating a new task
 * Omits system-generated fields like id, createdAt, etc.
 */
export interface CreateTaskInput {
  title: string;
  description: string;
  dateTime: Date;
  location?: string;
  priority?: TaskPriority;
  tags?: string[];
  estimatedDuration?: number;
}

/**
 * Interface for updating an existing task
 * All fields are optional to allow partial updates
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dateTime?: Date;
  location?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  estimatedDuration?: number;
}

/**
 * Sorting options for task lists
 */
export type TaskSortOption = 'dateAdded' | 'dueDate' | 'status' | 'priority' | 'title';

/**
 * Sort order for task lists
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Filter options for task lists
 */
export type TaskFilterOption = 'all' | TaskStatus;

/**
 * Interface for task list query parameters
 */
export interface TaskQueryOptions {
  /** Search term to filter tasks by title or description */
  searchTerm?: string;
  
  /** Status filter */
  statusFilter?: TaskFilterOption;
  
  /** Sort field */
  sortBy?: TaskSortOption;
  
  /** Sort order */
  sortOrder?: SortOrder;
  
  /** Priority filter */
  priorityFilter?: TaskPriority;
  
  /** Date range filter */
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

/**
 * Interface for task statistics and analytics
 */
export interface TaskStatistics {
  /** Total number of tasks */
  total: number;
  
  /** Number of pending tasks */
  pending: number;
  
  /** Number of in-progress tasks */
  inProgress: number;
  
  /** Number of completed tasks */
  completed: number;
  
  /** Number of cancelled tasks */
  cancelled: number;
  
  /** Completion rate as percentage */
  completionRate: number;
  
  /** Average task completion time in days */
  averageCompletionTime?: number;
  
  /** Most productive day of the week */
  mostProductiveDay?: string;
}

/**
 * Form validation error interface
 */
export interface ValidationError {
  /** Field name where the error occurred */
  field: string;
  
  /** Error message to display to user */
  message: string;
  
  /** Error code for programmatic handling */
  code?: string;
}

/**
 * Interface for form validation result
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  
  /** Array of validation errors if any */
  errors: ValidationError[];
}

/**
 * Interface for API response structure
 */
export interface ApiResponse<T = any> {
  /** Whether the operation was successful */
  success: boolean;
  
  /** Response data */
  data?: T;
  
  /** Error message if operation failed */
  message?: string;
  
  /** Error code for programmatic handling */
  errorCode?: string;
  
  /** Timestamp of the response */
  timestamp: Date;
}

/**
 * Interface for loading states in components
 */
export interface LoadingState {
  /** Whether any operation is currently loading */
  isLoading: boolean;
  
  /** Specific loading states for different operations */
  operations?: {
    saving?: boolean;
    loading?: boolean;
    deleting?: boolean;
    updating?: boolean;
  };
  
  /** Loading message to display */
  message?: string;
}

/**
 * Interface for error states in components
 */
export interface ErrorState {
  /** Whether there's an active error */
  hasError: boolean;
  
  /** Error message to display */
  message?: string;
  
  /** Error details for debugging */
  details?: string;
  
  /** Error type for different handling */
  type?: 'network' | 'validation' | 'storage' | 'unknown';
  
  /** Whether the error is recoverable */
  isRecoverable?: boolean;
}

/**
 * Interface for app navigation state
 */
export type AppScreen = 'onboarding' | 'taskList' | 'addTask' | 'editTask' | 'taskDetails' | 'settings';

/**
 * Interface for navigation parameters
 */
export interface NavigationParams {
  onboarding?: undefined;
  taskList?: undefined;
  addTask?: undefined;
  editTask?: { taskId: string };
  taskDetails?: { taskId: string };
  settings?: undefined;
}

/**
 * Theme type for consistent theming
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Interface for theme colors
 */
export interface ThemeColors {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  cardBackground: string;
  border: string;
  placeholder: string;
  pending: string;
  inProgress: string;
  completed: string;
  cancelled: string;
}

/**
 * Interface for app configuration
 */
export interface AppConfig {
  /** App version */
  version: string;
  
  /** Build number */
  buildNumber: string;
  
  /** Whether debug mode is enabled */
  debugMode: boolean;
  
  /** Maximum number of tasks allowed */
  maxTasks: number;
  
  /** Maximum file size for exports (in bytes) */
  maxExportSize: number;
  
  /** Default task reminder time (in minutes) */
  defaultReminderTime: number;
}

/**
 * Utility type for making specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Type guard for checking if a value is a valid TaskStatus
 */
export function isValidTaskStatus(value: any): value is TaskStatus {
  return ['pending', 'inProgress', 'completed', 'cancelled'].includes(value);
}

/**
 * Type guard for checking if a value is a valid TaskPriority
 */
export function isValidTaskPriority(value: any): value is TaskPriority {
  return ['low', 'medium', 'high', 'urgent'].includes(value);
}

/**
 * Type guard for checking if an object is a valid Task
 */
export function isValidTask(obj: any): obj is Task {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    obj.dateTime instanceof Date &&
    isValidTaskStatus(obj.status) &&
    obj.createdAt instanceof Date &&
    (obj.location === undefined || typeof obj.location === 'string')
  );
}