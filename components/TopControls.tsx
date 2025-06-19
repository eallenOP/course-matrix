import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings, Copy, Check, Download } from 'lucide-react';
import { SemesterType, Tasks } from '../types/course';

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
  tasks: Tasks;
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
  onCopyCourses,
  tasks
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

  const handleDownloadTasks = () => {
    // Convert tasks to the simplified format (just the tasks object)
    const jsonString = JSON.stringify(tasks, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `course-matrix-tasks-${activeSemester}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  const otherSemesterName = activeSemester === 'start' ? 'End of Semester' : 'Start of Semester';
  const canCopy = currentSemesterCourseCount > 0;
  const copyTooltip = canCopy 
    ? `Copy ${currentSemesterCourseCount} course${currentSemesterCourseCount === 1 ? '' : 's'} to ${otherSemesterName}`
    : 'No courses to copy';

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between mb-8 gap-4 sm:items-center">
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
      <div className="flex gap-2 sm:gap-4 items-center">
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
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copy to {activeSemester === 'start' ? 'End' : 'Start'}</span>
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadTasks}
          className="flex items-center gap-2"
          title="Download current task configuration as JSON"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download Tasks</span>
        </Button>
        <Button
          variant="outline"
          onClick={onToggleEditTasks}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">{isEditingTasks ? 'Done Editing' : 'Edit Tasks'}</span>
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
