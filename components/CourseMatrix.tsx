"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings, X, CheckCircle2, Circle, Minus, GripVertical } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  const [newTaskType, setNewTaskType] = useState<string>('');
  const [newSubtask, setNewSubtask] = useState<string>('');
  const [editingTaskType, setEditingTaskType] = useState<string | null>(null);
  const [draggedSubtask, setDraggedSubtask] = useState<string | null>(null);
  const [draggedTaskType, setDraggedTaskType] = useState<string | null>(null);
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

  const getStatusIcon = (status: boolean | 'na' | undefined) => {
    if (status === true) return <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />;
    if (status === 'na') return <Minus className="w-5 h-5 text-gray-400 mx-auto" />;
    return <Circle className="w-5 h-5 text-gray-300 mx-auto" />;
  };

  const handleDragStart = (taskType: string, subtask: string) => {
    setDraggedSubtask(subtask);
    setDraggedTaskType(taskType);
  };

  const handleDragOver = (e: React.DragEvent, taskType: string, targetSubtask: string) => {
    e.preventDefault();
    if (!draggedSubtask || draggedTaskType !== taskType) return;

    const subtaskList = [...tasks[taskType]];
    const draggedIndex = subtaskList.indexOf(draggedSubtask);
    const targetIndex = subtaskList.indexOf(targetSubtask);

    if (draggedIndex === targetIndex) return;

    subtaskList.splice(draggedIndex, 1);
    subtaskList.splice(targetIndex, 0, draggedSubtask);

    setTasks(prev => ({
      ...prev,
      [taskType]: subtaskList
    }));
  };

  const handleDragEnd = () => {
    setDraggedSubtask(null);
    setDraggedTaskType(null);
  };

  // Add new course
  const addCourse = () => {
    if (newCourseCode) {
      setCourses([...courses, { id: Date.now(), code: newCourseCode }]);
      setNewCourseCode('');
    }
  };

  // Task management
  const addTaskType = () => {
    if (newTaskType) {
      setTasks(prev => ({
        ...prev,
        [newTaskType]: []
      }));
      setNewTaskType('');
    }
  };

  const addSubtask = (taskType: string) => {
    if (newSubtask) {
      setTasks(prev => ({
        ...prev,
        [taskType]: [...prev[taskType], newSubtask]
      }));
      setNewSubtask('');
    }
  };

  const removeTaskType = (taskType: string) => {
    const { [taskType]: removed, ...rest } = tasks;
    setTasks(rest);
  };

  const removeSubtask = (taskType: string, subtask: string) => {
    setTasks(prev => ({
      ...prev,
      [taskType]: prev[taskType].filter(t => t !== subtask)
    }));
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
      {isEditingTasks && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Tasks</h2>

            {/* Add new task type */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="New Task Type"
                className="border p-2 rounded flex-grow"
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value)}
              />
              <Button onClick={addTaskType}>Add Task Type</Button>
            </div>

            {/* Edit existing tasks */}
            <div className="space-y-4">
              {Object.entries(tasks).map(([taskType, subtasks]) => (
                <div key={taskType} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">{taskType}</h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeTaskType(taskType)}
                    >
                      Remove
                    </Button>
                  </div>

                  {/* Add subtask */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="New Subtask"
                      className="border p-2 rounded flex-grow"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={() => addSubtask(taskType)}
                    >
                      Add
                    </Button>
                  </div>

                  {/* Subtask list */}
                  <div className="space-y-2">
                    {subtasks.map(subtask => (
                      <div
                        key={subtask}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        draggable
                        onDragStart={() => handleDragStart(taskType, subtask)}
                        onDragOver={(e) => handleDragOver(e, taskType, subtask)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <span>{subtask}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubtask(taskType, subtask)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matrix */}
      <Card>
        <CardContent className="p-6">
          {courses.length > 0 ? (
            <div className="relative overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-3 border-b text-left w-64">Tasks</th>
                    {courses.map(course => (
                      <th 
                        key={course.id} 
                        className="p-3 border-b text-center relative"
                        onMouseEnter={() => setHoveredCourse(course.id)}
                        onMouseLeave={() => setHoveredCourse(null)}
                      >
                        <div className="grid grid-cols-[1fr_auto] items-center">
                          <div className="col-span-2 text-center mb-1">
                            {course.code}
                          </div>
                          <div className="col-span-2 text-xs text-gray-500 text-center">
                            {calculateCourseProgress(course.id)}%
                          </div>
                          
                          {/* Positioned X button in the corner */}
                          {hoveredCourse === course.id && (
                            <div className="absolute top-2 right-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCourse(course.id);
                                }}
                                className="p-1 h-5 w-5 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                aria-label={`Remove ${course.code}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(tasks).map(([taskType, subtasks]) => (
                    <React.Fragment key={taskType}>
                      <tr className="bg-gray-50">
                        <td
                          className="p-3 font-medium cursor-pointer hover:bg-gray-100"
                          onClick={() => setExpandedTask(expandedTask === taskType ? null : taskType)}
                        >
                          <div className="flex justify-between items-center">
                            <span>{taskType}</span>
                            <span className="text-sm text-gray-500">
                              {calculateTaskProgress(taskType)}%
                            </span>
                          </div>
                        </td>
                        {courses.map(course => (
                          <td key={course.id} className="p-3 text-center border-l">
                            <Progress
                              value={calculateCourseTaskProgress(course.id, taskType)}
                              className="h-2"
                            />
                          </td>
                        ))}
                      </tr>
                      {expandedTask === taskType && subtasks.map(subtask => (
                        <tr key={subtask} className="border-b last:border-b-0">
                          <td className="p-3 pl-6 text-sm">{subtask}</td>
                          {courses.map(course => (
                            <td
                              key={course.id}
                              className="p-3 text-center border-l cursor-pointer hover:bg-gray-50"
                              onClick={() => toggleStatus(course.id, taskType, subtask)}
                            >
                              {getStatusIcon(taskStatus[`${course.id}-${taskType}-${subtask}`])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Add courses to begin tracking your preparation tasks
            </div>
          )}
        </CardContent>
      </Card>

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