"use client";

import React, { useState } from 'react';
import TaskEditor from './TaskEditor';
import MatrixTable from './MatrixTable';
import TopControls from './TopControls';
import Legend from './Legend';
import SemesterTabs from './SemesterTabs';
import SaveIndicator from './SaveIndicator';
import ErrorAlert from './ErrorAlert';
import { useSemesterPersistence } from '../hooks/useSemesterPersistence';
import { progressCalculations } from '../utils/progressCalculations';
import { resetTaskStatuses } from '../utils/taskActions';
import { Course, Tasks, SemesterType } from '../types/course';

const CourseMatrix = () => {
  // Default task types with their subtasks for start of semester
  const defaultStartTasks: Tasks = {
    'Course Directive': [
      'Update year and semester number',
      'Update term dates and holidays',
      'Save to moderation folder',
      'Upload to course materials'
    ],
    'Moodle': [
      'Update schedule',
      'Check assignment deadlines',
      'Update GitHub Classroom links',
      'Add students'
    ],
    'Teams Setup': [
      'Create class channel',
      'Add students',
      'Send welcome message',
      'Setup TAs'
    ]
  };

  // Default task types for end of semester
  const defaultEndTasks: Tasks = {
    'EBS': [
      'Marks entered',
      'Checked status',
      'Produce report'
    ],
    'Moodle': [
      'Download assessments',
      'Export grades',
      'Back up course',
      'Remove learners',
      'Reset course'
    ],
    'Archive and moderation': [
      'External assessment archive',
      'Moderation forms',
      'Grades in mod folder',
      'Submissions in mod folder'
    ]
  };

  // Use enhanced semester-aware persistence hook
  const { 
    activeSemester, 
    setActiveSemester,
    courses, 
    tasks, 
    taskStatus, 
    setCourses, 
    setTasks, 
    setTaskStatus,
    copyCourses,
    otherSemesterCourses,
    isLoading,
    storageError,
    lastSaved,
    clearStorageError
  } = useSemesterPersistence(defaultStartTasks, defaultEndTasks);

  // Local UI state
  const [newCourseCode, setNewCourseCode] = useState<string>('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isEditingTasks, setIsEditingTasks] = useState<boolean>(false);
  const [hoveredCourse, setHoveredCourse] = useState<number | null>(null);

  // Function to remove a course with confirmation
  const removeCourse = (courseId: number) => {
    const confirmRemove = window.confirm("Are you sure you want to remove this course?");
    if (confirmRemove) {
      setCourses(courses.filter((course: Course) => course.id !== courseId));
    }
  };

  // Task status can be: undefined/false (incomplete), true (complete), or 'na' (not applicable)
  const toggleStatus = (courseId: number, taskType: string, subtask: string) => {
    const key = `${courseId}-${taskType}-${subtask}`;
    setTaskStatus((prev) => {
      const currentStatus = prev[key];
      if (currentStatus === undefined || currentStatus === false) return { ...prev, [key]: true };
      if (currentStatus === true) return { ...prev, [key]: 'na' };
      return { ...prev, [key]: false };
    });
  };

  // Add new course
  const addCourse = () => {
    if (newCourseCode) {
      setCourses([...courses, { id: Date.now(), code: newCourseCode }]);
      setNewCourseCode('');
    }
  };

  // Handle reset all task statuses
  const handleResetProgress = () => {
    resetTaskStatuses(courses, tasks, setTaskStatus);
  };

  // Show loading screen only on very initial load (when we have no data at all)
  if (isLoading && courses.length === 0 && Object.keys(tasks).length <= 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your course data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Course Preparation Matrix</h1>

      {/* Error Alert - only show when there's an error */}
      {storageError && (
        <ErrorAlert
          error={storageError}
          onDismiss={clearStorageError}
        />
      )}

      {/* Semester tabs */}
      <SemesterTabs
        activeSemester={activeSemester}
        onSemesterChange={setActiveSemester}
      />

      {/* Top controls */}
      <TopControls
        newCourseCode={newCourseCode}
        onNewCourseCodeChange={setNewCourseCode}
        onAddCourse={addCourse}
        isEditingTasks={isEditingTasks}
        onToggleEditTasks={() => setIsEditingTasks(!isEditingTasks)}
        onResetProgress={handleResetProgress}
        activeSemester={activeSemester}
        currentSemesterCourseCount={courses.length}
        otherSemesterCourseCount={otherSemesterCourses.length}
        onCopyCourses={copyCourses}
        tasks={tasks}
      />

      {/* Task editor */}
      <TaskEditor
        tasks={tasks}
        onTasksChange={setTasks}
        isVisible={isEditingTasks}
        defaultTasks={activeSemester === 'start' ? defaultStartTasks : defaultEndTasks}
      />

      {/* Matrix */}
      <MatrixTable
        courses={courses}
        tasks={tasks}
        taskStatus={taskStatus}
        expandedTask={expandedTask}
        hoveredCourse={hoveredCourse}
        onExpandTask={setExpandedTask}
        onRemoveCourse={removeCourse}
        onToggleStatus={toggleStatus}
        onCourseHover={setHoveredCourse}
        calculateTaskProgress={(taskType: string) => 
          progressCalculations.calculateTaskProgress(taskType, courses, tasks, taskStatus)
        }
        calculateCourseTaskProgress={(courseId: number, taskType: string) => 
          progressCalculations.calculateCourseTaskProgress(courseId, taskType, tasks, taskStatus)
        }
        calculateCourseProgress={(courseId: number) => 
          progressCalculations.calculateCourseProgress(courseId, tasks, taskStatus)
        }
      />

      {/* Legend */}
      <Legend />
      
      {/* Floating Save Indicator */}
      <SaveIndicator
        isLoading={isLoading && courses.length > 0} // Only show loading for saves, not initial load
        error={storageError}
        lastSaved={lastSaved}
      />
    </div>
  );
};

export default CourseMatrix;