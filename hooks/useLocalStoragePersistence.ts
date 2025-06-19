"use client";

import { useState, useEffect } from 'react';
import { Course, TaskStatus, Tasks } from '../types/course';

// Generic hook for localStorage persistence
function useLocalStoragePersistence<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedValue = localStorage.getItem(key);
        if (savedValue) {
          setValue(JSON.parse(savedValue));
        }
      } catch (error) {
        console.warn(`Failed to load ${key} from localStorage:`, error);
      } finally {
        setIsInitialized(true);
      }
    } else {
      setIsInitialized(true);
    }
  }, [key]);

  // Save to localStorage whenever value changes (but not on initial load)
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error);
      }
    }
  }, [key, value, isInitialized]);

  return [value, setValue];
}

// Specialized hook for the course matrix data
interface CourseMatrixData {
  courses: Course[];
  tasks: Tasks;
  taskStatus: TaskStatus;
}

export function useCourseMatrixPersistence(defaultTasks: Tasks) {
  const [courses, setCourses] = useLocalStoragePersistence<Course[]>('courseMatrix_courses', []);
  const [tasks, setTasks] = useLocalStoragePersistence<Tasks>('courseMatrix_tasks', defaultTasks);
  const [taskStatus, setTaskStatus] = useLocalStoragePersistence<TaskStatus>('courseMatrix_taskStatus', {});

  return {
    courses,
    tasks,
    taskStatus,
    setCourses,
    setTasks,
    setTaskStatus,
  };
}

export default useLocalStoragePersistence;
