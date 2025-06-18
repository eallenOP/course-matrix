"use client";

import React, { useState } from 'react';
import TaskEditor from './TaskEditor';
import MatrixTable from './MatrixTable';
import TopControls from './TopControls';
import Legend from './Legend';
import SemesterTabs, { SemesterType } from './SemesterTabs';
import { useCourseMatrixPersistence } from '../hooks/useLocalStoragePersistence';
import { progressCalculations } from '../utils/progressCalculations';
import { resetTaskStatuses } from '../utils/taskActions';
import { Course, Tasks } from '../types/course';

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
      'Add students'
    ],
    'Teams Setup': [
      'Create class channel',
      'Add students',
      'Send welcome message',
      'Setup TAs'
    ]
  };

  // Default task types for end of semester (placeholder for now)
  const defaultEndTasks: Tasks = {
    'Final Grades': [
      'Calculate final grades',
      'Submit grades to registrar',
      'Archive course materials'
    ],
    'Course Evaluation': [
      'Review student feedback',
      'Complete teaching reflection',
      'Update course for next semester'
    ]
  };

  // Semester selection state
  const [activeSemester, setActiveSemester] = useState<SemesterType>('start');

  // Use custom hook for localStorage persistence (currently using start tasks)
  const { courses, tasks, taskStatus, setCourses, setTasks, setTaskStatus } = 
    useCourseMatrixPersistence(defaultStartTasks);

  // Local UI state
  const [newCourseCode, setNewCourseCode] = useState<string>('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isEditingTasks, setIsEditingTasks] = useState<boolean>(false);
  const [hoveredCourse, setHoveredCourse] = useState<number | null>(null);

  // Function to remove a course with confirmation
  const removeCourse = (courseId: number) => {
    const confirmRemove = window.confirm("Are you sure you want to remove this course?");
    if (confirmRemove) {
      setCourses(courses.filter(course => course.id !== courseId));
    }
  };

  // Task status can be: undefined/false (incomplete), true (complete), or 'na' (not applicable)
  const toggleStatus = (courseId: number, taskType: string, subtask: string) => {
    const key = `${courseId}-${taskType}-${subtask}`;
    setTaskStatus(prev => {
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Course Preparation Matrix</h1>

      {/* Semester tabs */}
      <SemesterTabs
        activeSemester={activeSemester}
        onSemesterChange={setActiveSemester}
      />

      {/* Temporary indicator - will be removed in next phase */}
      {activeSemester === 'end' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            🚧 End of semester view - Coming soon! Currently showing start-of-semester data.
          </p>
        </div>
      )}

      {/* Top controls */}
      <TopControls
        newCourseCode={newCourseCode}
        onNewCourseCodeChange={setNewCourseCode}
        onAddCourse={addCourse}
        isEditingTasks={isEditingTasks}
        onToggleEditTasks={() => setIsEditingTasks(!isEditingTasks)}
        onResetProgress={handleResetProgress}
      />

      {/* Task editor */}
      <TaskEditor
        tasks={tasks}
        onTasksChange={setTasks}
        isVisible={isEditingTasks}
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
    </div>
  );
};

export default CourseMatrix;