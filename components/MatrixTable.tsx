"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { X, CheckCircle2, Circle, Minus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Types
interface Course {
  id: number;
  code: string;
}

type TaskStatus = { [key: string]: boolean | 'na' | undefined };
type Tasks = { [key: string]: string[] };

interface MatrixTableProps {
  courses: Course[];
  tasks: Tasks;
  taskStatus: TaskStatus;
  expandedTask: string | null;
  hoveredCourse: number | null;
  onExpandTask: (taskType: string | null) => void;
  onRemoveCourse: (courseId: number) => void;
  onToggleStatus: (courseId: number, taskType: string, subtask: string) => void;
  onCourseHover: (courseId: number | null) => void;
  calculateTaskProgress: (taskType: string) => number;
  calculateCourseTaskProgress: (courseId: number, taskType: string) => number;
  calculateCourseProgress: (courseId: number) => number;
}

const MatrixTable: React.FC<MatrixTableProps> = ({
  courses,
  tasks,
  taskStatus,
  expandedTask,
  hoveredCourse,
  onExpandTask,
  onRemoveCourse,
  onToggleStatus,
  onCourseHover,
  calculateTaskProgress,
  calculateCourseTaskProgress,
  calculateCourseProgress,
}) => {
  const getStatusIcon = (status: boolean | 'na' | undefined) => {
    if (status === true) return <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />;
    if (status === 'na') return <Minus className="w-5 h-5 text-gray-400 mx-auto" />;
    return <Circle className="w-5 h-5 text-gray-300 mx-auto" />;
  };

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500 py-8">
            Add courses to begin tracking your preparation tasks
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-3 border-b text-left w-64">Tasks</th>
                {courses.map(course => (
                  <th 
                    key={course.id} 
                    className="p-3 border-b text-center relative"
                    onMouseEnter={() => onCourseHover(course.id)}
                    onMouseLeave={() => onCourseHover(null)}
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
                              onRemoveCourse(course.id);
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
                      onClick={() => onExpandTask(expandedTask === taskType ? null : taskType)}
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
                          onClick={() => onToggleStatus(course.id, taskType, subtask)}
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
      </CardContent>
    </Card>
  );
};

export default MatrixTable;
