import { useState, useEffect } from 'react';
import { SemesterType, SemesterData, Tasks, Course, TaskStatus } from '../types/course';

// Enhanced hook for multi-semester localStorage persistence
export function useSemesterPersistence(
  defaultStartTasks: Tasks,
  defaultEndTasks: Tasks
) {
  const [activeSemester, setActiveSemester] = useState<SemesterType>('start');
  const [startSemesterData, setStartSemesterData] = useState<SemesterData>({
    courses: [],
    tasks: defaultStartTasks,
    taskStatus: {}
  });
  const [endSemesterData, setEndSemesterData] = useState<SemesterData>({
    courses: [],
    tasks: defaultEndTasks,
    taskStatus: {}
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Load active semester preference
        const savedActiveSemester = localStorage.getItem('courseMatrix_activeSemester');
        if (savedActiveSemester && (savedActiveSemester === 'start' || savedActiveSemester === 'end')) {
          setActiveSemester(savedActiveSemester);
        }

        // Load start semester data
        const savedStartData = localStorage.getItem('courseMatrix_startSemester');
        if (savedStartData) {
          const parsedStartData = JSON.parse(savedStartData);
          setStartSemesterData({
            courses: parsedStartData.courses || [],
            tasks: parsedStartData.tasks || defaultStartTasks,
            taskStatus: parsedStartData.taskStatus || {}
          });
        }

        // Load end semester data
        const savedEndData = localStorage.getItem('courseMatrix_endSemester');
        if (savedEndData) {
          const parsedEndData = JSON.parse(savedEndData);
          setEndSemesterData({
            courses: parsedEndData.courses || [],
            tasks: parsedEndData.tasks || defaultEndTasks,
            taskStatus: parsedEndData.taskStatus || {}
          });
        }
      } catch (error) {
        console.warn('Failed to load semester data from localStorage:', error);
      } finally {
        setIsInitialized(true);
      }
    }
  }, [defaultStartTasks, defaultEndTasks]);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem('courseMatrix_activeSemester', activeSemester);
      } catch (error) {
        console.warn('Failed to save active semester to localStorage:', error);
      }
    }
  }, [activeSemester, isInitialized]);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem('courseMatrix_startSemester', JSON.stringify(startSemesterData));
      } catch (error) {
        console.warn('Failed to save start semester data to localStorage:', error);
      }
    }
  }, [startSemesterData, isInitialized]);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem('courseMatrix_endSemester', JSON.stringify(endSemesterData));
      } catch (error) {
        console.warn('Failed to save end semester data to localStorage:', error);
      }
    }
  }, [endSemesterData, isInitialized]);

  // Get current semester data
  const currentSemesterData = activeSemester === 'start' ? startSemesterData : endSemesterData;

  // Update functions for current semester
  const updateCurrentSemesterData = (updates: Partial<SemesterData>) => {
    if (activeSemester === 'start') {
      setStartSemesterData(prev => ({ ...prev, ...updates }));
    } else {
      setEndSemesterData(prev => ({ ...prev, ...updates }));
    }
  };

  const setCourses = (courses: Course[]) => {
    updateCurrentSemesterData({ courses });
  };

  const setTasks = (tasks: Tasks) => {
    updateCurrentSemesterData({ tasks });
  };

  const setTaskStatus = (taskStatus: TaskStatus | ((prev: TaskStatus) => TaskStatus)) => {
    if (typeof taskStatus === 'function') {
      const currentTaskStatus = currentSemesterData.taskStatus;
      const newTaskStatus = taskStatus(currentTaskStatus);
      updateCurrentSemesterData({ taskStatus: newTaskStatus });
    } else {
      updateCurrentSemesterData({ taskStatus });
    }
  };

  return {
    // Current semester data
    activeSemester,
    setActiveSemester,
    courses: currentSemesterData.courses,
    tasks: currentSemesterData.tasks,
    taskStatus: currentSemesterData.taskStatus,
    
    // Update functions
    setCourses,
    setTasks,
    setTaskStatus,
    
    // Raw semester data (for debugging or advanced use)
    startSemesterData,
    endSemesterData,
    setStartSemesterData,
    setEndSemesterData
  };
}
