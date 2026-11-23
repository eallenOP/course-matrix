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
  const [nameError, setNameError] = useState<string | null>(null);
  const [editingTaskType, setEditingTaskType] = useState<string | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<{ taskType: string; subtask: string } | null>(null);
  const [editTaskTypeValue, setEditTaskTypeValue] = useState<string>('');
  const [editSubtaskValue, setEditSubtaskValue] = useState<string>('');

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
    const name = newTaskType.trim();
    if (name && !hasTaskType(name)) {
      updateTasks({
        ...tasks,
        [name]: []
      });
      setNewTaskType('');
    }
  };

  const addSubtask = (taskType: string) => {
    const subtaskValue = (newSubtasks[taskType] || '').trim();
    if (subtaskValue && !hasSubtask(taskType, subtaskValue)) {
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
    if (!window.confirm(`Remove "${taskType}" and all its subtasks?`)) return;
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
    setNameError(null);
    onTasksChange(newTasks);
  };

  const hasTaskType = (name: string) => {
    if (!Object.keys(tasks).includes(name)) return false;
    setNameError(`Task type "${name}" already exists`);
    return true;
  };

  // Case-insensitive, matching how duplicates are dropped when saved data is loaded
  const hasSubtask = (taskType: string, name: string, except?: string) => {
    if (!tasks[taskType].some(s => s !== except && s.toLowerCase() === name.toLowerCase())) return false;
    setNameError(`"${name}" already exists in ${taskType}`);
    return true;
  };

  const resetToDefault = () => {
    if (!window.confirm('Replace these tasks with the defaults? Your changes to this list will be lost.')) return;
    updateTasks(defaultTasks);
  };

  const startEditingTaskType = (taskType: string) => {
    setEditingTaskType(taskType);
    setEditTaskTypeValue(taskType);
  };

  const startEditingSubtask = (taskType: string, subtask: string) => {
    setEditingSubtask({ taskType, subtask });
    setEditSubtaskValue(subtask);
  };

  const saveTaskTypeEdit = () => {
    if (editingTaskType && editTaskTypeValue.trim() && editTaskTypeValue.trim() !== editingTaskType && !hasTaskType(editTaskTypeValue.trim())) {
      const newTaskTypeName = editTaskTypeValue.trim();
      const subtasks = tasks[editingTaskType];
      
      // Preserve the original order by rebuilding the object with the same key positions
      const newTasks: Tasks = {};
      
      Object.entries(tasks).forEach(([taskType, taskSubtasks]) => {
        if (taskType === editingTaskType) {
          // Replace with new name at the same position
          newTasks[newTaskTypeName] = subtasks;
        } else {
          // Keep existing task types unchanged
          newTasks[taskType] = taskSubtasks;
        }
      });
      
      updateTasks(newTasks);
    }
    setEditingTaskType(null);
    setEditTaskTypeValue('');
  };

  const saveSubtaskEdit = () => {
    if (editingSubtask && editSubtaskValue.trim() && editSubtaskValue.trim() !== editingSubtask.subtask &&
        !hasSubtask(editingSubtask.taskType, editSubtaskValue.trim(), editingSubtask.subtask)) {
      const { taskType, subtask } = editingSubtask;
      const updatedSubtasks = tasks[taskType].map(s => 
        s === subtask ? editSubtaskValue.trim() : s
      );
      updateTasks({
        ...tasks,
        [taskType]: updatedSubtasks
      });
    }
    setEditingSubtask(null);
    setEditSubtaskValue('');
  };

  const cancelTaskTypeEdit = () => {
    setEditingTaskType(null);
    setEditTaskTypeValue('');
  };

  const cancelSubtaskEdit = () => {
    setEditingSubtask(null);
    setEditSubtaskValue('');
  };

  const handleTaskTypeEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveTaskTypeEdit();
    } else if (e.key === 'Escape') {
      cancelTaskTypeEdit();
    }
  };

  const handleSubtaskEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveSubtaskEdit();
    } else if (e.key === 'Escape') {
      cancelSubtaskEdit();
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Edit Tasks</h2>
          <Button
            variant="outline"
            onClick={resetToDefault}
            title="Replace this list with the default tasks"
          >
            Reset to Default
          </Button>
        </div>

        {/* Add new task type */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="New Task Type"
            className="border p-2 rounded flex-grow"
            value={newTaskType}
            onChange={(e) => {
              setNewTaskType(e.target.value);
              setNameError(null);
            }}
            onKeyDown={handleTaskTypeKeyPress}
          />
          <Button onClick={addTaskType}>Add Task Type</Button>
        </div>

        {nameError && (
          <p role="alert" className="-mt-4 mb-6 text-sm text-destructive">{nameError}</p>
        )}

        {/* Edit existing tasks */}
        <div className="space-y-4">
          {Object.entries(tasks).map(([taskType, subtasks]) => (
            <div key={taskType} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                {editingTaskType === taskType ? (
                  <input
                    type="text"
                    value={editTaskTypeValue}
                    onChange={(e) => setEditTaskTypeValue(e.target.value)}
                    onKeyDown={handleTaskTypeEditKeyPress}
                    onBlur={saveTaskTypeEdit}
                    className="font-medium bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                    autoFocus
                  />
                ) : (
                  <h3 
                    className="font-medium cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
                    onClick={() => startEditingTaskType(taskType)}
                    title="Click to edit task type name"
                  >
                    {taskType}
                  </h3>
                )}
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
                    draggable={!editingSubtask || (editingSubtask.taskType !== taskType || editingSubtask.subtask !== subtask)}
                    onDragStart={() => handleDragStart(taskType, subtask)}
                    onDragOver={(e) => handleDragOver(e, taskType, subtask)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center gap-2 flex-grow">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      {editingSubtask?.taskType === taskType && editingSubtask?.subtask === subtask ? (
                        <input
                          type="text"
                          value={editSubtaskValue}
                          onChange={(e) => setEditSubtaskValue(e.target.value)}
                          onKeyDown={handleSubtaskEditKeyPress}
                          onBlur={saveSubtaskEdit}
                          className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 flex-grow"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="cursor-pointer hover:bg-gray-200 px-1 py-0.5 rounded transition-colors flex-grow"
                          onClick={() => startEditingSubtask(taskType, subtask)}
                          title="Click to edit subtask text"
                        >
                          {subtask}
                        </span>
                      )}
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
