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
  defaultTasks: Tasks;
}

const TaskEditor: React.FC<TaskEditorProps> = ({ tasks, onTasksChange, isVisible, defaultTasks }) => {
  const [newTaskType, setNewTaskType] = useState<string>('');
  const [newSubtasks, setNewSubtasks] = useState<{ [taskType: string]: string }>({});
  const [draggedSubtask, setDraggedSubtask] = useState<string | null>(null);
  const [draggedTaskType, setDraggedTaskType] = useState<string | null>(null);
  const [previousTasks, setPreviousTasks] = useState<Tasks | null>(null);

  const handleDragStart = (taskType: string, subtask: string) => {
    setDraggedSubtask(subtask);
    setDraggedTaskType(taskType);
  };

  const handleTaskTypeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTaskType();
    }
  };

  const handleSubtaskKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, taskType: string) => {
    if (e.key === 'Enter') {
      addSubtask(taskType);
    }
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

    updateTasks({
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
      updateTasks({
        ...tasks,
        [newTaskType]: []
      });
      setNewTaskType('');
    }
  };

  const addSubtask = (taskType: string) => {
    const subtaskValue = newSubtasks[taskType] || '';
    if (subtaskValue) {
      updateTasks({
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
    updateTasks(rest);
  };

  const removeSubtask = (taskType: string, subtask: string) => {
    updateTasks({
      ...tasks,
      [taskType]: tasks[taskType].filter(t => t !== subtask)
    });
  };

  const updateTasks = (newTasks: Tasks) => {
    setPreviousTasks(null); // Clear undo state on manual changes
    onTasksChange(newTasks);
  };

  const resetToDefault = () => {
    setPreviousTasks({ ...tasks }); // Save current state for undo
    onTasksChange(defaultTasks);
  };

  const undoReset = () => {
    if (previousTasks) {
      onTasksChange(previousTasks);
      setPreviousTasks(null); // Clear undo state
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Edit Tasks</h2>
          <div className="flex gap-2">
            {previousTasks && (
              <Button
                variant="outline"
                onClick={undoReset}
                title="Undo reset to restore previous tasks"
              >
                Undo Reset
              </Button>
            )}
            <Button
              variant="outline"
              onClick={resetToDefault}
              title="Reset tasks to default tasks"
            >
              Reset to Default
            </Button>
          </div>
        </div>

        {/* Add new task type */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="New Task Type"
            className="border p-2 rounded flex-grow"
            value={newTaskType}
            onChange={(e) => setNewTaskType(e.target.value)}
            onKeyDown={handleTaskTypeKeyPress}
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
                  onKeyDown={(e) => handleSubtaskKeyPress(e, taskType)}
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
