import { useState, useEffect, useCallback } from 'react';
import { SemesterType, SemesterData, Tasks, Course, TaskStatus } from '../types/course';
import { safeGetItem, safeSetItem, storage } from '../utils/storage';
import { validateSemesterData, validateSemesterType, recoverCorruptedData } from '../utils/dataValidation';

// Enhanced hook for multi-semester localStorage persistence with error handling
export function useSemesterPersistence(
  defaultStartTasks: Tasks,
  defaultEndTasks: Tasks
) {
  const [activeSemester, setActiveSemester] = useState<SemesterType>('start');
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Separate state for each semester
  const [startCourses, setStartCourses] = useState<Course[]>([]);
  const [startTasks, setStartTasks] = useState<Tasks>(defaultStartTasks);
  const [startTaskStatus, setStartTaskStatus] = useState<TaskStatus>({});

  const [endCourses, setEndCourses] = useState<Course[]>([]);
  const [endTasks, setEndTasks] = useState<Tasks>(defaultEndTasks);
  const [endTaskStatus, setEndTaskStatus] = useState<TaskStatus>({});

  // Error handling callback
  const handleStorageError = useCallback((error: Error) => {
    setStorageError(`Storage error: ${error.message}`);
    console.error('Storage operation failed:', error);
  }, []);

  // Set up error callback
  useEffect(() => {
    storage.setErrorCallback(handleStorageError);
  }, [handleStorageError]);

  // Load data from localStorage on mount (only once)
  useEffect(() => {
    const loadData = async () => {
      // Safety check for browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.warn('Running in non-browser environment, using defaults');
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setStorageError(null);

        // Test storage functionality first
        if (!storage.testStorage()) {
          throw new Error('Storage is not functional');
        }

        // Load active semester
        const activeSemesterResult = safeGetItem<SemesterType>('courseMatrix_activeSemester', {
          fallback: 'start',
          onError: handleStorageError
        });
        
        if (activeSemesterResult.success && activeSemesterResult.data) {
          const semester = activeSemesterResult.data;
          if (validateSemesterType(semester)) {
            setActiveSemester(semester);
          } else {
            console.warn('Invalid semester type in storage, using default');
            setActiveSemester('start');
          }
        }

        // Load start semester data with validation
        const startDataResult = safeGetItem<any>('courseMatrix_startSemester', {
          fallback: null,
          onError: handleStorageError
        });

        if (startDataResult.success && startDataResult.data) {
          try {
            // Validate and fix the data
            const validation = validateSemesterData(startDataResult.data, defaultStartTasks);
            
            if (validation.warnings.length > 0) {
              console.warn('Start semester data issues fixed:', validation.warnings);
              setStorageError(`Data issues were automatically fixed: ${validation.warnings.length} warnings`);
            }
            
            if (validation.isValid || validation.fixedData) {
              const fixedData = validation.fixedData as SemesterData;
              setStartCourses(fixedData.courses);
              setStartTasks(fixedData.tasks);
              setStartTaskStatus(fixedData.taskStatus);
            } else {
              throw new Error('Could not recover start semester data');
            }
          } catch (error) {
            console.error('Failed to validate start semester data:', error);
            setStorageError('Start semester data was corrupted and has been reset');
            // Use defaults
            setStartCourses([]);
            setStartTasks(defaultStartTasks);
            setStartTaskStatus({});
          }
        } else {
          // No data found or error, use defaults
          setStartCourses([]);
          setStartTasks(defaultStartTasks);
          setStartTaskStatus({});
        }

        // Load end semester data with validation
        const endDataResult = safeGetItem<any>('courseMatrix_endSemester', {
          fallback: null,
          onError: handleStorageError
        });

        if (endDataResult.success && endDataResult.data) {
          try {
            // Validate and fix the data
            const validation = validateSemesterData(endDataResult.data, defaultEndTasks);
            
            if (validation.warnings.length > 0) {
              console.warn('End semester data issues fixed:', validation.warnings);
              if (!storageError) { // Don't override existing errors
                setStorageError(`Data issues were automatically fixed: ${validation.warnings.length} warnings`);
              }
            }
            
            if (validation.isValid || validation.fixedData) {
              const fixedData = validation.fixedData as SemesterData;
              setEndCourses(fixedData.courses);
              setEndTasks(fixedData.tasks);
              setEndTaskStatus(fixedData.taskStatus);
            } else {
              throw new Error('Could not recover end semester data');
            }
          } catch (error) {
            console.error('Failed to validate end semester data:', error);
            setStorageError('End semester data was corrupted and has been reset');
            // Use defaults
            setEndCourses([]);
            setEndTasks(defaultEndTasks);
            setEndTaskStatus({});
          }
        } else {
          // No data found or error, use defaults
          setEndCourses([]);
          setEndTasks(defaultEndTasks);
          setEndTaskStatus({});
        }

      } catch (error) {
        const err = error as Error;
        handleStorageError(err);
        console.warn('Failed to load data, using defaults:', err.message);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // Empty dependency array - only run once!

  // Save active semester when it changes (but not during initial load)
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  useEffect(() => {
    if (isInitialized && hasLoadedInitialData && typeof window !== 'undefined') {
      const saveActiveSemester = async () => {
        const result = await safeSetItem('courseMatrix_activeSemester', activeSemester, {
          onError: handleStorageError
        });
        
        if (result.success) {
          setLastSaved(new Date());
        } else {
          setStorageError(result.error || 'Failed to save active semester');
        }
      };
      
      saveActiveSemester();
    }
  }, [activeSemester, isInitialized, hasLoadedInitialData, handleStorageError]);

  // Save start semester data when it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      const saveStartData = async () => {
        const startData: SemesterData = {
          courses: startCourses,
          tasks: startTasks,
          taskStatus: startTaskStatus
        };
        
        const result = await safeSetItem('courseMatrix_startSemester', startData, {
          onError: handleStorageError
        });
        
        if (result.success) {
          setLastSaved(new Date());
          setStorageError(null); // Clear any previous errors
        } else {
          setStorageError(result.error || 'Failed to save start semester data');
        }
      };
      
      saveStartData();
    }
  }, [startCourses, startTasks, startTaskStatus, isInitialized, handleStorageError]);

  // Save end semester data when it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      const saveEndData = async () => {
        const endData: SemesterData = {
          courses: endCourses,
          tasks: endTasks,
          taskStatus: endTaskStatus
        };
        
        const result = await safeSetItem('courseMatrix_endSemester', endData, {
          onError: handleStorageError
        });
        
        if (result.success) {
          setLastSaved(new Date());
          setStorageError(null); // Clear any previous errors
        } else {
          setStorageError(result.error || 'Failed to save end semester data');
        }
      };
      
      saveEndData();
    }
  }, [endCourses, endTasks, endTaskStatus, isInitialized, handleStorageError]);

  // Helper functions to update semester data
  const updateCourses = (courses: Course[]) => {
    if (activeSemester === 'start') {
      setStartCourses(courses);
    } else {
      setEndCourses(courses);
    }
  };

  const updateTasks = (tasks: Tasks) => {
    if (activeSemester === 'start') {
      setStartTasks(tasks);
    } else {
      setEndTasks(tasks);
    }
  };

  const updateTaskStatus = (taskStatus: TaskStatus | ((prev: TaskStatus) => TaskStatus)) => {
    if (activeSemester === 'start') {
      setStartTaskStatus(taskStatus);
    } else {
      setEndTaskStatus(taskStatus);
    }
  };

  // Function to copy courses from current semester to the other semester
  const copyCourses = () => {
    // Determine source (current semester) and target (other semester)
    const sourceCourses = activeSemester === 'start' ? startCourses : endCourses;
    const targetCourses = activeSemester === 'start' ? endCourses : startCourses;
    const setTargetCourses = activeSemester === 'start' ? setEndCourses : setStartCourses;

    // Create copies of source courses with new IDs
    const coursesToCopy = sourceCourses.map(course => ({
      ...course,
      id: Date.now() + Math.random() // Generate new unique ID
    }));

    // Filter out courses that already exist (by code) in the target semester
    const targetCodes = targetCourses.map(c => c.code);
    const newCourses = coursesToCopy.filter(course => !targetCodes.includes(course.code));

    // Append new courses to existing ones in target semester
    setTargetCourses([...targetCourses, ...newCourses]);
  };

  // Get current semester data
  const currentData = activeSemester === 'start' 
    ? { courses: startCourses, tasks: startTasks, taskStatus: startTaskStatus }
    : { courses: endCourses, tasks: endTasks, taskStatus: endTaskStatus };

  // Get other semester data for display purposes
  const otherSemesterData = activeSemester === 'start' 
    ? { courses: endCourses, tasks: endTasks, taskStatus: endTaskStatus }
    : { courses: startCourses, tasks: startTasks, taskStatus: startTaskStatus };

  // Wrapper for setActiveSemester that tracks user-initiated changes
  const handleSetActiveSemester = useCallback((semester: SemesterType) => {
    setHasLoadedInitialData(true); // Mark that user has made a change
    setActiveSemester(semester);
  }, []);

  return {
    activeSemester,
    setActiveSemester: handleSetActiveSemester,
    courses: currentData.courses,
    tasks: currentData.tasks,
    taskStatus: currentData.taskStatus,
    setCourses: updateCourses,
    setTasks: updateTasks,
    setTaskStatus: updateTaskStatus,
    copyCourses,
    otherSemesterCourses: otherSemesterData.courses,
    // New state for error handling and loading
    isLoading,
    storageError,
    lastSaved,
    clearStorageError: () => setStorageError(null),
  };
}
