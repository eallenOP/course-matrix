import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings, Copy, Check, Download, Upload } from 'lucide-react';
import { SemesterType, Tasks } from '../types/course';
import { parseTaskFile } from '../utils/taskFile';

interface TopControlsProps {
  newCourseCode: string;
  onNewCourseCodeChange: (code: string) => void;
  onAddCourse: () => void;
  isEditingTasks: boolean;
  onToggleEditTasks: () => void;
  onStartFresh: (keepCourses: boolean) => void;
  onImportTasks: (tasks: Tasks) => void;
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
  onStartFresh,
  onImportTasks,
  activeSemester,
  currentSemesterCourseCount,
  otherSemesterCourseCount,
  onCopyCourses,
  tasks
}) => {
  const [justCopied, setJustCopied] = useState(false);
  const [isStartingFresh, setIsStartingFresh] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportTasks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Allow choosing the same file again
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onerror = () => setImportError(`Could not read "${file.name}".`);
    reader.onload = () => {
      let imported: Tasks;
      try {
        imported = parseTaskFile(String(reader.result));
      } catch {
        setImportError(`"${file.name}" is not a task list saved with Download Tasks.`);
        return;
      }
      if (window.confirm(`Replace the ${semesterName} tasks with "${file.name}"?`)) {
        onImportTasks(imported);
      }
    };
    reader.readAsText(file);
  };

  const handleStartFresh = (keepCourses: boolean) => {
    onStartFresh(keepCourses);
    setIsStartingFresh(false);
  };

  const semesterName = activeSemester === 'start' ? 'Start of Semester' : 'End of Semester';
  const otherSemesterName = activeSemester === 'start' ? 'End of Semester' : 'Start of Semester';
  const canCopy = currentSemesterCourseCount > 0;
  const copyTooltip = canCopy 
    ? `Copy ${currentSemesterCourseCount} course${currentSemesterCourseCount === 1 ? '' : 's'} to ${otherSemesterName}`
    : 'No courses to copy';

  return (
    <div className="mb-8">
      <div className="flex flex-col wide:flex-row wide:justify-between gap-4 wide:items-center">
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
        <div className="flex flex-wrap gap-2 items-center">
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
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy to {activeSemester === 'start' ? 'End' : 'Start'}</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadTasks}
            className="flex items-center gap-2"
            title="Download current task configuration as JSON"
            aria-label="Download Tasks"
          >
            <Download className="w-4 h-4" />
            <span className="hidden xl:inline">Download Tasks</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
            title="Replace these tasks with a downloaded task file"
            aria-label="Import Tasks"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden xl:inline">Import Tasks</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            data-testid="import-tasks-input"
            onChange={handleImportTasks}
          />
          <Button
            variant="outline"
            onClick={onToggleEditTasks}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>{isEditingTasks ? 'Done Editing' : 'Edit Tasks'}</span>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsStartingFresh(true)}
            disabled={currentSemesterCourseCount === 0}
            className="flex items-center gap-2"
            title="Clear progress to reuse this checklist"
          >
            <span>Start fresh</span>
          </Button>
        </div>
      </div>
      {importError && (
        <p role="alert" className="mt-2 text-sm text-destructive">{importError}</p>
      )}
      {isStartingFresh && currentSemesterCourseCount > 0 && (
        <div role="group" aria-label="Start fresh" className="mt-4 flex flex-wrap items-center gap-2 rounded border p-3">
          <span className="mr-2 text-sm">
            Clear all {semesterName} progress? Your task list stays.
          </span>
          <Button variant="destructive" onClick={() => handleStartFresh(true)}>Keep courses</Button>
          <Button variant="destructive" onClick={() => handleStartFresh(false)}>Clear courses too</Button>
          <Button variant="outline" onClick={() => setIsStartingFresh(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
};

export default TopControls;
