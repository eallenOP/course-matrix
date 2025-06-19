import { useState, useEffect } from 'react';
import { SemesterType, SemesterData, Tasks, Course, TaskStatus } from '../types/course';

// Enhanced hook for multi-semester localStorage persistence
export function useSemesterPersistence(
  defaultStartTasks: Tasks,
  defaultEndTasks: Tasks
) {
  const [activeSemester, setActiveSemester] = useState<SemesterType>('start');
  const [isInitialized, setIsInitialized] = useState(false);

  // Separate state for each semester
  const [startCourses, setStartCourses] = useState<Course[]>([]);
  const [startTasks, setStartTasks] = useState<Tasks>(defaultStartTasks);
  const [startTaskStatus, setStartTaskStatus] = useState<TaskStatus>({});

  const [endCourses, setEndCourses] = useState<Course[]>([]);
  const [endTasks, setEndTasks] = useState<Tasks>(defaultEndTasks);
  const [endTaskStatus, setEndTaskStatus] = useState<TaskStatus>({});

  // Load data from localStorage on mount (only once)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Load active semester
        const savedActiveSemester = localStorage.getItem('courseMatrix_activeSemester');
        if (savedActiveSemester && (savedActiveSemester === 'start' || savedActiveSemester === 'end')) {
          setActiveSemester(savedActiveSemester as SemesterType);
        }

        // Load start semester data
        const savedStartData = localStorage.getItem('courseMatrix_startSemester');
        if (savedStartData) {
          const parsedStartData = JSON.parse(savedStartData);
          setStartCourses(parsedStartData.courses || []);
          setStartTasks(parsedStartData.tasks || defaultStartTasks);
          setStartTaskStatus(parsedStartData.taskStatus || {});
        }

        // Load end semester data
        const savedEndData = localStorage.getItem('courseMatrix_endSemester');
        if (savedEndData) {
          const parsedEndData = JSON.parse(savedEndData);
          setEndCourses(parsedEndData.courses || []);
          setEndTasks(parsedEndData.tasks || defaultEndTasks);
          setEndTaskStatus(parsedEndData.taskStatus || {});
        }
      } catch (error) {
        console.warn('Failed to load data from localStorage:', error);
      } finally {
        setIsInitialized(true);
      }
    } else {
      setIsInitialized(true);
    }
  }, []); // Empty dependency array - only run once!

  // Save active semester when it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem('courseMatrix_activeSemester', activeSemester);
      } catch (error) {
        console.warn('Failed to save active semester to localStorage:', error);
      }
    }
  }, [activeSemester, isInitialized]);

  // Save start semester data when it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        const startData = {
          courses: startCourses,
          tasks: startTasks,
          taskStatus: startTaskStatus
        };
        localStorage.setItem('courseMatrix_startSemester', JSON.stringify(startData));
      } catch (error) {
        console.warn('Failed to save start semester data to localStorage:', error);
      }
    }
  }, [startCourses, startTasks, startTaskStatus, isInitialized]);

  // Save end semester data when it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        const endData = {
          courses: endCourses,
          tasks: endTasks,
          taskStatus: endTaskStatus
        };
        localStorage.setItem('courseMatrix_endSemester', JSON.stringify(endData));
      } catch (error) {
        console.warn('Failed to save end semester data to localStorage:', error);
      }
    }
  }, [endCourses, endTasks, endTaskStatus, isInitialized]);

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
    if (activeSemester === 'start') {
      // Copy from start to end
      setEndCourses([...startCourses]);
    } else {
      // Copy from end to start
      setStartCourses([...endCourses]);
    }
  };

  // Get current semester data
  const currentData = activeSemester === 'start' 
    ? { courses: startCourses, tasks: startTasks, taskStatus: startTaskStatus }
    : { courses: endCourses, tasks: endTasks, taskStatus: endTaskStatus };

  // Get other semester data for display purposes
  const otherSemesterData = activeSemester === 'start' 
    ? { courses: endCourses, tasks: endTasks, taskStatus: endTaskStatus }
    : { courses: startCourses, tasks: startTasks, taskStatus: startTaskStatus };

  return {
    activeSemester,
    setActiveSemester,
    courses: currentData.courses,
    tasks: currentData.tasks,
    taskStatus: currentData.taskStatus,
    setCourses: updateCourses,
    setTasks: updateTasks,
    setTaskStatus: updateTaskStatus,
    copyCourses,
    otherSemesterCourses: otherSemesterData.courses,
  };
}
