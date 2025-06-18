"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings, CheckCircle2, Circle, Minus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import TaskEditor from './TaskEditor';
import MatrixTable from './MatrixTable';

// Types for the course and task data
interface Course {
  id: number;
  code: string;
}

type TaskStatus = { [key: string]: boolean | 'na' | undefined };
type Tasks = { [key: string]: string[] }; // Each task type maps to an array of subtasks

const CourseMatrix = () => {
  // Default task types with their subtasks
  const defaultTasks: Tasks = {
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

  // Initialize state with types
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Tasks>(defaultTasks);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({});
  const [newCourseCode, setNewCourseCode] = useState<string>('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isEditingTasks, setIsEditingTasks] = useState<boolean>(false);
  const [hoveredCourse, setHoveredCourse] = useState<number | null>(null);

  useEffect(() => {
    // Check if the window object is available (indicating client-side rendering)
    if (typeof window !== 'undefined') {
      const savedCourses = localStorage.getItem('courseMatrix_courses');
      const savedTasks = localStorage.getItem('courseMatrix_tasks');
      const savedTaskStatus = localStorage.getItem('courseMatrix_taskStatus');

      if (savedCourses) setCourses(JSON.parse(savedCourses));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedTaskStatus) setTaskStatus(JSON.parse(savedTaskStatus));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('courseMatrix_courses', JSON.stringify(courses));
    }
  }, [courses]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('courseMatrix_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('courseMatrix_taskStatus', JSON.stringify(taskStatus));
    }
  }, [taskStatus]);

  // Reset all checkboxes to not done
  const resetAllTaskStatuses = () => {
    const confirmReset = window.confirm("Are you sure you want to reset all tasks to unchecked?");

    if (confirmReset) {
      const resetStatus: TaskStatus = {};

      // Initialize task status for every course, task, and subtask
      courses.forEach(course => {
        Object.keys(tasks).forEach(taskType => {
          tasks[taskType].forEach(subtask => {
            resetStatus[`${course.id}-${taskType}-${subtask}`] = false;
          });
        });
      });

      setTaskStatus(resetStatus);
    }
  };

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

  // Calculate progress (excluding N/A tasks)
  const calculateTaskProgress = (taskType: string) => {
    let total = 0;
    let completed = 0;

    courses.forEach(course => {
      tasks[taskType].forEach(subtask => {
        const status = taskStatus[`${course.id}-${taskType}-${subtask}`];
        if (status !== 'na') {
          total++;
          if (status === true) {
            completed++;
          }
        }
      });
    });

    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  // Calculate progress for a specific task type in a specific course
  const calculateCourseTaskProgress = (courseId: number, taskType: string) => {
    let totalActiveTasks = 0;
    let completedTasks = 0;

    tasks[taskType].forEach(subtask => {
      const status = taskStatus[`${courseId}-${taskType}-${subtask}`];
      if (status !== 'na') {
        totalActiveTasks++;
        if (status === true) {
          completedTasks++;
        }
      }
    });

    return totalActiveTasks === 0 ? 0 : Math.round((completedTasks / totalActiveTasks) * 100);
  };

  const calculateCourseProgress = (courseId: number) => {
    let total = 0;
    let completed = 0;

    Object.keys(tasks).forEach(taskType => {
      tasks[taskType].forEach(subtask => {
        const status = taskStatus[`${courseId}-${taskType}-${subtask}`];
        if (status !== 'na') {
          total++;
          if (status === true) {
            completed++;
          }
        }
      });
    });

    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Course Preparation Matrix</h1>

      {/* Top controls */}
      <div className="flex justify-between mb-8 items-center">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Course Code"
            className="border p-2 rounded"
            value={newCourseCode}
            onChange={(e) => setNewCourseCode(e.target.value)}
          />
          <Button onClick={addCourse} className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Add Course
          </Button>
        </div>
        <div className="flex gap-4 items-center">
          <Button
            variant="outline"
            onClick={() => setIsEditingTasks(!isEditingTasks)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {isEditingTasks ? 'Done Editing' : 'Edit Tasks'}
          </Button>
          {/* Compact reset button */}
          <Button
            variant="destructive"
            onClick={resetAllTaskStatuses}
            className="flex items-center gap-2 px-4 py-2 text-sm"
          >
            Reset Progress
          </Button>
        </div>
      </div>

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
        calculateTaskProgress={calculateTaskProgress}
        calculateCourseTaskProgress={calculateCourseTaskProgress}
        calculateCourseProgress={calculateCourseProgress}
      />

      {/* Legend */}
      <div className="mt-4 flex gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-gray-300" /> Not Started
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" /> Completed
        </div>
        <div className="flex items-center gap-2">
          <Minus className="w-4 h-4 text-gray-400" /> Not Applicable
        </div>
      </div>
    </div>
  );
};

export default CourseMatrix;