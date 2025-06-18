import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings } from 'lucide-react';

interface TopControlsProps {
  newCourseCode: string;
  onNewCourseCodeChange: (code: string) => void;
  onAddCourse: () => void;
  isEditingTasks: boolean;
  onToggleEditTasks: () => void;
  onResetProgress: () => void;
}

const TopControls: React.FC<TopControlsProps> = ({
  newCourseCode,
  onNewCourseCodeChange,
  onAddCourse,
  isEditingTasks,
  onToggleEditTasks,
  onResetProgress
}) => {
  const handleCourseCodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onAddCourse();
    }
  };

  return (
    <div className="flex justify-between mb-8 items-center">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Course Code"
          className="border p-2 rounded"
          value={newCourseCode}
          onChange={(e) => onNewCourseCodeChange(e.target.value)}
          onKeyDown={handleCourseCodeKeyPress}
        />
        <Button onClick={onAddCourse} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Add Course
        </Button>
      </div>
      <div className="flex gap-4 items-center">
        <Button
          variant="outline"
          onClick={onToggleEditTasks}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          {isEditingTasks ? 'Done Editing' : 'Edit Tasks'}
        </Button>
        <Button
          variant="destructive"
          onClick={onResetProgress}
          className="flex items-center gap-2 px-4 py-2 text-sm"
        >
          Reset Progress
        </Button>
      </div>
    </div>
  );
};

export default TopControls;
