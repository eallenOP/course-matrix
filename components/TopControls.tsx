import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings, Copy, Check } from 'lucide-react';
import { SemesterType } from '../types/course';

interface TopControlsProps {
  newCourseCode: string;
  onNewCourseCodeChange: (code: string) => void;
  onAddCourse: () => void;
  isEditingTasks: boolean;
  onToggleEditTasks: () => void;
  onResetProgress: () => void;
  activeSemester: SemesterType;
  currentSemesterCourseCount: number;
  otherSemesterCourseCount: number;
  onCopyCourses: () => void;
}

const TopControls: React.FC<TopControlsProps> = ({
  newCourseCode,
  onNewCourseCodeChange,
  onAddCourse,
  isEditingTasks,
  onToggleEditTasks,
  onResetProgress,
  activeSemester,
  currentSemesterCourseCount,
  otherSemesterCourseCount,
  onCopyCourses
}) => {
  const [justCopied, setJustCopied] = useState(false);

  const handleCourseCodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onAddCourse();
    }
  };

  const handleCopyCourses = () => {
    onCopyCourses();
    setJustCopied(true);
    // Reset the feedback after 2.5 seconds
    setTimeout(() => setJustCopied(false), 2500);
  };

  const otherSemesterName = activeSemester === 'start' ? 'End of Semester' : 'Start of Semester';
  const canCopy = currentSemesterCourseCount > 0;
  const copyTooltip = canCopy 
    ? `Copy ${currentSemesterCourseCount} course${currentSemesterCourseCount === 1 ? '' : 's'} to ${otherSemesterName}`
    : 'No courses to copy';

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
          onClick={handleCopyCourses}
          disabled={!canCopy}
          className="flex items-center gap-2"
          title={copyTooltip}
        >
          {justCopied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy to {activeSemester === 'start' ? 'End' : 'Start'}
            </>
          )}
        </Button>
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
