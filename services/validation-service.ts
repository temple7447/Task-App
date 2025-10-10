/**
 * Validation Service - Comprehensive input validation for TaskMaster
 * 
 * This service provides robust validation for all user inputs with detailed
 * error messages and real-time feedback capabilities.
 * 
 * Features:
 * - Real-time validation as user types
 * - Detailed, user-friendly error messages
 * - Multiple validation rules per field
 * - Async validation support
 * - Custom validation rules
 */

import { 
  ValidationError, 
  ValidationResult, 
  CreateTaskInput, 
  UpdateTaskInput,
  TaskStatus,
  TaskPriority,
  isValidTaskStatus,
  isValidTaskPriority 
} from '../types/task-types';

// Validation rule type definition
type ValidationRule<T> = (value: T, allFields?: any) => string | null;

// Field validation configuration
interface FieldValidationConfig<T> {
  rules: ValidationRule<T>[];
  required?: boolean;
  label?: string;
}

/**
 * Common validation rules that can be reused across different fields
 */
export class ValidationRules {
  /**
   * Validates that a string is not empty and has content
   * @param minLength - Minimum required length (default: 1)
   * @param maxLength - Maximum allowed length (default: no limit)
   * @returns Validation rule function
   */
  static required(minLength: number = 1, maxLength?: number): ValidationRule<string> {
    return (value: string) => {
      if (!value || typeof value !== 'string') {
        return 'This field is required';
      }
      
      const trimmedValue = value.trim();
      
      if (trimmedValue.length === 0) {
        return 'This field cannot be empty';
      }
      
      if (trimmedValue.length < minLength) {
        return `Must be at least ${minLength} character${minLength === 1 ? '' : 's'} long`;
      }
      
      if (maxLength && trimmedValue.length > maxLength) {
        return `Must be no more than ${maxLength} characters long`;
      }
      
      return null;
    };
  }

  /**
   * Validates string length within specified bounds
   * @param min - Minimum length
   * @param max - Maximum length
   * @returns Validation rule function
   */
  static length(min: number, max: number): ValidationRule<string> {
    return (value: string) => {
      if (!value) return null; // Let required rule handle empty values
      
      const length = value.trim().length;
      
      if (length < min) {
        return `Must be at least ${min} characters long`;
      }
      
      if (length > max) {
        return `Must be no more than ${max} characters long`;
      }
      
      return null;
    };
  }

  /**
   * Validates that a string contains only allowed characters
   * @param allowedPattern - Regular expression for allowed characters
   * @param errorMessage - Custom error message
   * @returns Validation rule function
   */
  static pattern(allowedPattern: RegExp, errorMessage: string): ValidationRule<string> {
    return (value: string) => {
      if (!value) return null; // Let required rule handle empty values
      
      if (!allowedPattern.test(value)) {
        return errorMessage;
      }
      
      return null;
    };
  }

  /**
   * Validates that a date is not in the past (with optional tolerance)
   * @param allowPast - Whether past dates are allowed (default: false)
   * @param tolerance - Tolerance in minutes for "current" time (default: 5)
   * @returns Validation rule function
   */
  static futureDate(allowPast: boolean = false, tolerance: number = 5): ValidationRule<Date> {
    return (value: Date) => {
      if (!value || !(value instanceof Date)) {
        return 'Please enter a valid date';
      }
      
      if (isNaN(value.getTime())) {
        return 'Please enter a valid date';
      }
      
      if (!allowPast) {
        const now = new Date();
        const toleranceMs = tolerance * 60 * 1000; // Convert minutes to milliseconds
        const minimumTime = new Date(now.getTime() - toleranceMs);
        
        if (value < minimumTime) {
          return 'Date and time cannot be in the past';
        }
      }
      
      return null;
    };
  }

  /**
   * Validates that a date is within a reasonable range
   * @param maxYearsFromNow - Maximum years from current date (default: 10)
   * @returns Validation rule function
   */
  static reasonableDate(maxYearsFromNow: number = 10): ValidationRule<Date> {
    return (value: Date) => {
      if (!value || !(value instanceof Date)) {
        return null; // Let other rules handle invalid dates
      }
      
      const now = new Date();
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(now.getFullYear() + maxYearsFromNow);
      
      if (value > maxFutureDate) {
        return `Date cannot be more than ${maxYearsFromNow} years from now`;
      }
      
      return null;
    };
  }

  /**
   * Validates that a value is one of the allowed enum values
   * @param allowedValues - Array of allowed values
   * @param fieldName - Name of the field for error message
   * @returns Validation rule function
   */
  static enum<T>(allowedValues: T[], fieldName: string = 'value'): ValidationRule<T> {
    return (value: T) => {
      if (value === undefined || value === null) {
        return null; // Let required rule handle missing values
      }
      
      if (!allowedValues.includes(value)) {
        return `Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}`;
      }
      
      return null;
    };
  }

  /**
   * Validates that a string doesn't contain potentially harmful content
   * @returns Validation rule function
   */
  static noHarmfulContent(): ValidationRule<string> {
    return (value: string) => {
      if (!value) return null;
      
      // Check for potential script tags or harmful content
      const harmfulPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // Event handlers like onclick=
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
      ];
      
      for (const pattern of harmfulPatterns) {
        if (pattern.test(value)) {
          return 'Content contains potentially harmful code and is not allowed';
        }
      }
      
      return null;
    };
  }

  /**
   * Validates email format (for future use)
   * @returns Validation rule function
   */
  static email(): ValidationRule<string> {
    return (value: string) => {
      if (!value) return null;
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
      
      return null;
    };
  }

  /**
   * Validates phone number format (for future use)
   * @returns Validation rule function
   */
  static phoneNumber(): ValidationRule<string> {
    return (value: string) => {
      if (!value) return null;
      
      // Remove all non-digit characters for validation
      const digitsOnly = value.replace(/\D/g, '');
      
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        return 'Please enter a valid phone number';
      }
      
      return null;
    };
  }

  /**
   * Custom validation for task titles
   * @returns Validation rule function
   */
  static taskTitle(): ValidationRule<string> {
    return (value: string) => {
      if (!value) return null;
      
      const trimmed = value.trim();
      
      // Check for meaningful content (not just spaces or special characters)
      if (!/[a-zA-Z0-9]/.test(trimmed)) {
        return 'Task title must contain at least one letter or number';
      }
      
      // Check for reasonable length
      if (trimmed.length < 3) {
        return 'Task title should be at least 3 characters long';
      }
      
      return null;
    };
  }

  /**
   * Custom validation for location strings
   * @returns Validation rule function
   */
  static location(): ValidationRule<string> {
    return (value: string) => {
      if (!value) return null; // Location is optional
      
      const trimmed = value.trim();
      
      if (trimmed.length === 0) {
        return null; // Empty is allowed for optional fields
      }
      
      // Basic location format validation
      if (trimmed.length < 3) {
        return 'Location should be at least 3 characters long';
      }
      
      // Check for at least some meaningful content
      if (!/[a-zA-Z0-9]/.test(trimmed)) {
        return 'Location must contain letters or numbers';
      }
      
      return null;
    };
  }
}

/**
 * Main Validation Service class
 */
export class ValidationService {
  /**
   * Validates task creation input with comprehensive rules
   * @param input - The task input to validate
   * @returns ValidationResult with any errors found
   */
  static validateCreateTaskInput(input: Partial<CreateTaskInput>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate title
    const titleErrors = this.validateField(
      input.title,
      'title',
      'Task Title',
      [
        ValidationRules.required(1, 100),
        ValidationRules.taskTitle(),
        ValidationRules.noHarmfulContent(),
      ]
    );
    errors.push(...titleErrors);

    // Validate description
    const descriptionErrors = this.validateField(
      input.description,
      'description',
      'Description',
      [
        ValidationRules.required(1, 500),
        ValidationRules.noHarmfulContent(),
      ]
    );
    errors.push(...descriptionErrors);

    // Validate dateTime
    const dateTimeErrors = this.validateField(
      input.dateTime,
      'dateTime',
      'Date and Time',
      [
        (value: Date) => {
          if (!value) return 'Date and time is required';
          if (!(value instanceof Date)) return 'Please enter a valid date';
          if (isNaN(value.getTime())) return 'Please enter a valid date';
          return null;
        },
        ValidationRules.futureDate(false, 5),
        ValidationRules.reasonableDate(10),
      ]
    );
    errors.push(...dateTimeErrors);

    // Validate location (optional)
    if (input.location !== undefined) {
      const locationErrors = this.validateField(
        input.location,
        'location',
        'Location',
        [
          ValidationRules.length(0, 200),
          ValidationRules.location(),
          ValidationRules.noHarmfulContent(),
        ]
      );
      errors.push(...locationErrors);
    }

    // Validate priority (optional)
    if (input.priority !== undefined) {
      const priorityErrors = this.validateField(
        input.priority,
        'priority',
        'Priority',
        [
          (value: any) => {
            if (!isValidTaskPriority(value)) {
              return 'Invalid priority level';
            }
            return null;
          }
        ]
      );
      errors.push(...priorityErrors);
    }

    // Validate estimated duration (optional)
    if (input.estimatedDuration !== undefined) {
      const durationErrors = this.validateField(
        input.estimatedDuration,
        'estimatedDuration',
        'Estimated Duration',
        [
          (value: number) => {
            if (typeof value !== 'number' || isNaN(value)) {
              return 'Duration must be a valid number';
            }
            if (value < 1) {
              return 'Duration must be at least 1 minute';
            }
            if (value > 10080) { // 1 week in minutes
              return 'Duration cannot exceed 1 week';
            }
            return null;
          }
        ]
      );
      errors.push(...durationErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates task update input (partial updates allowed)
   * @param input - The task update input to validate
   * @returns ValidationResult with any errors found
   */
  static validateUpdateTaskInput(input: UpdateTaskInput): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate only provided fields (partial update)
    if (input.title !== undefined) {
      const titleErrors = this.validateField(
        input.title,
        'title',
        'Task Title',
        [
          ValidationRules.required(1, 100),
          ValidationRules.taskTitle(),
          ValidationRules.noHarmfulContent(),
        ]
      );
      errors.push(...titleErrors);
    }

    if (input.description !== undefined) {
      const descriptionErrors = this.validateField(
        input.description,
        'description',
        'Description',
        [
          ValidationRules.required(1, 500),
          ValidationRules.noHarmfulContent(),
        ]
      );
      errors.push(...descriptionErrors);
    }

    if (input.dateTime !== undefined) {
      const dateTimeErrors = this.validateField(
        input.dateTime,
        'dateTime',
        'Date and Time',
        [
          (value: Date) => {
            if (!(value instanceof Date)) return 'Please enter a valid date';
            if (isNaN(value.getTime())) return 'Please enter a valid date';
            return null;
          },
          ValidationRules.futureDate(false, 5),
          ValidationRules.reasonableDate(10),
        ]
      );
      errors.push(...dateTimeErrors);
    }

    if (input.location !== undefined) {
      const locationErrors = this.validateField(
        input.location,
        'location',
        'Location',
        [
          ValidationRules.length(0, 200),
          ValidationRules.location(),
          ValidationRules.noHarmfulContent(),
        ]
      );
      errors.push(...locationErrors);
    }

    if (input.status !== undefined) {
      const statusErrors = this.validateField(
        input.status,
        'status',
        'Status',
        [
          (value: any) => {
            if (!isValidTaskStatus(value)) {
              return 'Invalid task status';
            }
            return null;
          }
        ]
      );
      errors.push(...statusErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a single field against multiple rules
   * @param value - The value to validate
   * @param fieldName - The field name for error reporting
   * @param fieldLabel - Human-readable field label
   * @param rules - Array of validation rules to apply
   * @returns Array of validation errors
   */
  private static validateField<T>(
    value: T,
    fieldName: string,
    fieldLabel: string,
    rules: ValidationRule<T>[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      try {
        const errorMessage = rule(value);
        if (errorMessage) {
          errors.push({
            field: fieldName,
            message: errorMessage,
            code: `${fieldName}_invalid`,
          });
          // Stop at first error for better UX
          break;
        }
      } catch (error) {
        // Handle unexpected validation errors
        console.error(`Validation error for field ${fieldName}:`, error);
        errors.push({
          field: fieldName,
          message: `Validation failed for ${fieldLabel}`,
          code: `${fieldName}_validation_error`,
        });
        break;
      }
    }

    return errors;
  }

  /**
   * Validates a date string input (e.g., "2024-12-25")
   * @param dateString - The date string to validate
   * @returns ValidationResult
   */
  static validateDateString(dateString: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!dateString || dateString.trim().length === 0) {
      errors.push({
        field: 'date',
        message: 'Date is required',
        code: 'date_required',
      });
    } else {
      // Check format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        errors.push({
          field: 'date',
          message: 'Date must be in YYYY-MM-DD format',
          code: 'date_format_invalid',
        });
      } else {
        // Check if it's a valid date
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          errors.push({
            field: 'date',
            message: 'Please enter a valid date',
            code: 'date_invalid',
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a time string input (e.g., "14:30")
   * @param timeString - The time string to validate
   * @returns ValidationResult
   */
  static validateTimeString(timeString: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!timeString || timeString.trim().length === 0) {
      errors.push({
        field: 'time',
        message: 'Time is required',
        code: 'time_required',
      });
    } else {
      // Check format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(timeString)) {
        errors.push({
          field: 'time',
          message: 'Time must be in HH:MM format (24-hour)',
          code: 'time_format_invalid',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Combines date and time strings into a Date object with validation
   * @param dateString - Date in YYYY-MM-DD format
   * @param timeString - Time in HH:MM format
   * @returns Object with combined date and any validation errors
   */
  static combineDateAndTime(dateString: string, timeString: string): {
    dateTime?: Date;
    errors: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    // Validate individual components
    const dateValidation = this.validateDateString(dateString);
    const timeValidation = this.validateTimeString(timeString);

    errors.push(...dateValidation.errors, ...timeValidation.errors);

    if (errors.length > 0) {
      return { errors };
    }

    try {
      // Combine date and time
      const dateTime = new Date(`${dateString}T${timeString}:00`);
      
      if (isNaN(dateTime.getTime())) {
        errors.push({
          field: 'dateTime',
          message: 'Invalid date and time combination',
          code: 'datetime_invalid',
        });
        return { errors };
      }

      return { dateTime, errors: [] };
    } catch (error) {
      errors.push({
        field: 'dateTime',
        message: 'Failed to create valid date and time',
        code: 'datetime_creation_failed',
      });
      return { errors };
    }
  }

  /**
   * Gets user-friendly error message for a specific field
   * @param errors - Array of validation errors
   * @param fieldName - Name of the field to get error for
   * @returns Error message or null if no error
   */
  static getFieldError(errors: ValidationError[], fieldName: string): string | null {
    const fieldError = errors.find(error => error.field === fieldName);
    return fieldError ? fieldError.message : null;
  }

  /**
   * Checks if a specific field has validation errors
   * @param errors - Array of validation errors
   * @param fieldName - Name of the field to check
   * @returns Whether the field has errors
   */
  static hasFieldError(errors: ValidationError[], fieldName: string): boolean {
    return errors.some(error => error.field === fieldName);
  }

  /**
   * Gets all error messages as a formatted string
   * @param errors - Array of validation errors
   * @returns Formatted error message string
   */
  static getErrorSummary(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return '';
    }

    if (errors.length === 1) {
      return errors[0].message;
    }

    return errors.map((error, index) => `${index + 1}. ${error.message}`).join('\n');
  }
}
