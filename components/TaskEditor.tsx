"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';
import { Tasks } from '../types/course';

interface TaskEditorProps {
  tasks: Tasks;
  onTasksChange: (tasks: Tasks) => void;
  isVisible: boolean;
}

const TaskEditor: React.FC<TaskEditorProps> = ({ tasks, onTasksChange, isVisible }) => {
  const [newTaskType, setNewTaskType] = useState<string>('');
  const [newSubtasks, setNewSubtasks] = useState<{ [taskType: string]: string }>({});
  const [draggedSubtask, setDraggedSubtask] = useState<string | null>(null);
  const [draggedTaskType, setDraggedTaskType] = useState<string | null>(null);

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

    onTasksChange({
      ...tasks,
      [taskType]: subtaskList
    });
  };

  const handleDragEnd = () => {
    setDraggedSubtask(null);
    setDraggedTaskType(null);
  };

  const addTaskType = () => {
    if (newTaskType) {
      onTasksChange({
        ...tasks,
        [newTaskType]: []
      });
      setNewTaskType('');
    }
  };

  const addSubtask = (taskType: string) => {
    const subtaskValue = newSubtasks[taskType] || '';
    if (subtaskValue) {
      onTasksChange({
        ...tasks,
        [taskType]: [...tasks[taskType], subtaskValue]
      });
      setNewSubtasks(prev => ({
        ...prev,
        [taskType]: ''
      }));
    }
  };

  const removeTaskType = (taskType: string) => {
    const { [taskType]: removed, ...rest } = tasks;
    onTasksChange(rest);
  };

  const removeSubtask = (taskType: string, subtask: string) => {
    onTasksChange({
      ...tasks,
      [taskType]: tasks[taskType].filter(t => t !== subtask)
    });
  };

  if (!isVisible) return null;

  return (
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
                  value={newSubtasks[taskType] || ''}
                  onChange={(e) => setNewSubtasks(prev => ({
                    ...prev,
                    [taskType]: e.target.value
                  }))}
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
  );
};

export default TaskEditor;
