/**
 * Data validation utilities for course matrix data
 */

import { Course, Tasks, TaskStatus, SemesterData, SemesterType } from '../types/course';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedData?: any;
}

/**
 * Validates a course object
 */
export function validateCourse(course: any): course is Course {
  return (
    typeof course === 'object' &&
    course !== null &&
    typeof course.id === 'number' &&
    typeof course.code === 'string' &&
    course.code.trim().length > 0
  );
}

/**
 * Validates courses array and fixes common issues
 */
export function validateCourses(courses: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    fixedData: []
  };

  if (!Array.isArray(courses)) {
    result.isValid = false;
    result.errors.push('Courses must be an array');
    result.fixedData = [];
    return result;
  }

  const validCourses: Course[] = [];
  const seenIds = new Set<number>();
  const seenCodes = new Set<string>();

  courses.forEach((course, index) => {
    if (!validateCourse(course)) {
      result.warnings.push(`Invalid course at index ${index}, skipping`);
      return;
    }

    // Check for duplicate IDs
    if (seenIds.has(course.id)) {
      result.warnings.push(`Duplicate course ID ${course.id}, generating new ID`);
      course.id = Date.now() + Math.random();
    }
    seenIds.add(course.id);

    // Check for duplicate codes
    if (seenCodes.has(course.code.toUpperCase())) {
      result.warnings.push(`Duplicate course code ${course.code}, skipping`);
      return;
    }
    seenCodes.add(course.code.toUpperCase());

    validCourses.push({
      id: course.id,
      code: course.code.trim()
    });
  });

  result.fixedData = validCourses;
  return result;
}

/**
 * Validates tasks object
 */
export function validateTasks(tasks: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    fixedData: {}
  };

  if (typeof tasks !== 'object' || tasks === null) {
    result.isValid = false;
    result.errors.push('Tasks must be an object');
    result.fixedData = {};
    return result;
  }

  const validTasks: Tasks = {};

  Object.entries(tasks).forEach(([taskType, subtasks]) => {
    if (typeof taskType !== 'string' || taskType.trim().length === 0) {
      result.warnings.push(`Invalid task type, skipping`);
      return;
    }

    if (!Array.isArray(subtasks)) {
      result.warnings.push(`Task type "${taskType}" must have an array of subtasks, skipping`);
      return;
    }

    const validSubtasks: string[] = [];
    const seenSubtasks = new Set<string>();

    subtasks.forEach((subtask, index) => {
      if (typeof subtask !== 'string' || subtask.trim().length === 0) {
        result.warnings.push(`Invalid subtask at ${taskType}[${index}], skipping`);
        return;
      }

      const trimmedSubtask = subtask.trim();
      if (seenSubtasks.has(trimmedSubtask.toLowerCase())) {
        result.warnings.push(`Duplicate subtask "${trimmedSubtask}" in ${taskType}, skipping`);
        return;
      }

      seenSubtasks.add(trimmedSubtask.toLowerCase());
      validSubtasks.push(trimmedSubtask);
    });

    if (validSubtasks.length > 0) {
      validTasks[taskType.trim()] = validSubtasks;
    }
  });

  result.fixedData = validTasks;
  return result;
}

/**
 * Validates task status object
 */
export function validateTaskStatus(taskStatus: any, courses: Course[], tasks: Tasks): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    fixedData: {}
  };

  if (typeof taskStatus !== 'object' || taskStatus === null) {
    result.isValid = false;
    result.errors.push('Task status must be an object');
    result.fixedData = {};
    return result;
  }

  const validTaskStatus: TaskStatus = {};
  const validKeys = new Set<string>();

  // Generate valid keys based on courses and tasks
  courses.forEach(course => {
    Object.entries(tasks).forEach(([taskType, subtasks]) => {
      subtasks.forEach(subtask => {
        validKeys.add(`${course.id}-${taskType}-${subtask}`);
      });
    });
  });

  Object.entries(taskStatus).forEach(([key, value]) => {
    if (typeof key !== 'string') {
      result.warnings.push(`Invalid task status key, skipping`);
      return;
    }

    // Validate key format
    const keyParts = key.split('-');
    if (keyParts.length < 3) {
      result.warnings.push(`Invalid task status key format "${key}", skipping`);
      return;
    }

    // Check if this key is still valid (course/task still exists)
    if (!validKeys.has(key)) {
      result.warnings.push(`Orphaned task status "${key}", removing`);
      return;
    }

    // Validate value
    if (value !== true && value !== false && value !== 'na' && value !== undefined) {
      result.warnings.push(`Invalid task status value for "${key}", resetting to false`);
      validTaskStatus[key] = false;
      return;
    }

    validTaskStatus[key] = value;
  });

  result.fixedData = validTaskStatus;
  return result;
}

/**
 * Validates complete semester data
 */
export function validateSemesterData(data: any, defaultTasks: Tasks): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    fixedData: {
      courses: [],
      tasks: defaultTasks,
      taskStatus: {}
    }
  };

  if (typeof data !== 'object' || data === null) {
    result.isValid = false;
    result.errors.push('Semester data must be an object');
    return result;
  }

  // Validate courses
  const coursesResult = validateCourses(data.courses);
  result.errors.push(...coursesResult.errors);
  result.warnings.push(...coursesResult.warnings);
  const validatedCourses = coursesResult.fixedData as Course[];

  // Validate tasks
  const tasksResult = validateTasks(data.tasks);
  result.errors.push(...tasksResult.errors);
  result.warnings.push(...tasksResult.warnings);
  const validatedTasks = Object.keys(tasksResult.fixedData).length > 0 
    ? tasksResult.fixedData as Tasks 
    : defaultTasks;

  // Validate task status
  const taskStatusResult = validateTaskStatus(data.taskStatus, validatedCourses, validatedTasks);
  result.errors.push(...taskStatusResult.errors);
  result.warnings.push(...taskStatusResult.warnings);
  const validatedTaskStatus = taskStatusResult.fixedData as TaskStatus;

  result.fixedData = {
    courses: validatedCourses,
    tasks: validatedTasks,
    taskStatus: validatedTaskStatus
  };

  if (result.errors.length > 0) {
    result.isValid = false;
  }

  return result;
}

/**
 * Validates semester type
 */
export function validateSemesterType(value: any): value is SemesterType {
  return value === 'start' || value === 'end';
}

/**
 * Attempts to recover corrupted data by applying fixes
 */
export function recoverCorruptedData(data: any, defaultTasks: Tasks): SemesterData {
  const validation = validateSemesterData(data, defaultTasks);
  
  if (validation.warnings.length > 0) {
    console.warn('Data recovery applied fixes:', validation.warnings);
  }
  
  if (validation.errors.length > 0) {
    console.error('Data recovery could not fix all errors:', validation.errors);
  }
  
  return validation.fixedData as SemesterData;
}
