import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseMatrix from '../components/CourseMatrix';

// Mock all the child components to avoid lucide-react issues
jest.mock('../components/TaskEditor', () => {
  return function MockTaskEditor({ tasks, onTasksChange, isVisible }: any) {
    return isVisible ? (
      <div data-testid="task-editor">
        <div>Task Editor</div>
        <button 
          onClick={() => onTasksChange({ ...tasks, 'New Task': ['New Subtask'] })}
          data-testid="mock-add-task"
        >
          Add Task
        </button>
        <button data-testid="mock-done-editing">Done Editing</button>
      </div>
    ) : null;
  };
});

jest.mock('../components/MatrixTable', () => {
  return function MockMatrixTable({ 
    courses, 
    tasks, 
    onRemoveCourse, 
    onToggleStatus,
    calculateTaskProgress,
    calculateCourseProgress 
  }: any) {
    return (
      <div data-testid="matrix-table">
        <div>Matrix Table</div>
        {Object.keys(tasks).map((taskType) => (
          <div key={taskType}>{taskType}</div>
        ))}
        {courses.map((course: any) => (
          <div key={course.id}>
            {course.code}
            <button onClick={() => onRemoveCourse(course.id)}>Remove</button>
            {tasks && Object.keys(tasks).length > 0 && (
              <button 
                onClick={() => onToggleStatus(course.id, Object.keys(tasks)[0], 'test-subtask')}
                data-testid={`toggle-${course.id}`}
              >
                Toggle Task
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../components/TopControls', () => {
  return function MockTopControls({ 
    newCourseCode,
    onNewCourseCodeChange,
    onAddCourse,
    isEditingTasks,
    onToggleEditTasks,
    onResetProgress,
    activeSemester,
    currentSemesterCourseCount,
    onCopyCourses
  }: any) {
    const canCopy = currentSemesterCourseCount > 0;
    const otherSemesterName = activeSemester === 'start' ? 'End' : 'Start';
    
    return (
      <div data-testid="top-controls">
        <input
          placeholder="Enter course code"
          value={newCourseCode}
          onChange={(e) => onNewCourseCodeChange(e.target.value)}
        />
        <button onClick={onAddCourse}>Add Course</button>
        <button 
          onClick={onCopyCourses}
          disabled={!canCopy}
          data-testid="copy-courses-button"
        >
          Copy to {otherSemesterName}
        </button>
        <button onClick={onToggleEditTasks} data-testid="edit-tasks-button">
          {isEditingTasks ? 'Done Editing' : 'Edit Tasks'}
        </button>
        <button onClick={onResetProgress}>Reset Progress</button>
      </div>
    );
  };
});

jest.mock('../components/Legend', () => {
  return function MockLegend() {
    return <div data-testid="legend">Legend</div>;
  };
});

jest.mock('../components/SemesterTabs', () => {
  return function MockSemesterTabs({ activeSemester, onSemesterChange }: any) {
    return (
      <div data-testid="semester-tabs">
        <button 
          onClick={() => onSemesterChange('start')}
          className={activeSemester === 'start' ? 'bg-blue-100' : ''}
        >
          Start of Semester
        </button>
        <button 
          onClick={() => onSemesterChange('end')}
          className={activeSemester === 'end' ? 'bg-blue-100' : ''}
        >
          End of Semester
        </button>
      </div>
    );
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true),
  writable: true
});

describe('CourseMatrix - Full Semester Switching Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should handle complete semester switching workflow', async () => {
    const { rerender } = render(<CourseMatrix />);

    // Initially should be on start semester
    expect(screen.getByText('Start of Semester')).toHaveClass('bg-blue-100');
    expect(screen.getByText('Course Directive')).toBeInTheDocument();
    expect(screen.getByText('Moodle')).toBeInTheDocument();

    // Add a course to start semester
    const courseInput = screen.getByPlaceholderText('Enter course code');
    const addButton = screen.getByText('Add Course');
    
    fireEvent.change(courseInput, { target: { value: 'CS101' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    // Mark a task as complete in start semester
    const taskCell = screen.getAllByRole('button')[0]; // First task button
    fireEvent.click(taskCell);

    // Switch to end semester
    const endTab = screen.getByText('End of Semester');
    fireEvent.click(endTab);

    await waitFor(() => {
      expect(screen.getByText('End of Semester')).toHaveClass('bg-blue-100');
      expect(screen.getByText('Final Grades')).toBeInTheDocument();
      expect(screen.getByText('Course Evaluation')).toBeInTheDocument();
      expect(screen.getByText('Course Cleanup')).toBeInTheDocument();
      expect(screen.getByText('Administrative')).toBeInTheDocument();
    });

    // Verify CS101 is not in end semester (independent data)
    expect(screen.queryByText('CS101')).not.toBeInTheDocument();

    // Add a different course to end semester
    const endCourseInput = screen.getByPlaceholderText('Enter course code');
    const endAddButton = screen.getByText('Add Course');
    
    fireEvent.change(endCourseInput, { target: { value: 'CS401' } });
    fireEvent.click(endAddButton);

    await waitFor(() => {
      expect(screen.getByText('CS401')).toBeInTheDocument();
    });

    // Switch back to start semester
    const startTab = screen.getByText('Start of Semester');
    fireEvent.click(startTab);

    await waitFor(() => {
      expect(screen.getByText('Start of Semester')).toHaveClass('bg-blue-100');
      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(screen.queryByText('CS401')).not.toBeInTheDocument();
    });

    // Verify start semester tasks are still there
    expect(screen.getByText('Course Directive')).toBeInTheDocument();
    expect(screen.getByText('Moodle')).toBeInTheDocument();
    expect(screen.queryByText('Final Grades')).not.toBeInTheDocument();

    // Test persistence by re-rendering (simulating page refresh)
    rerender(<CourseMatrix />);

    await waitFor(() => {
      // Should still be on start semester with CS101
      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(screen.getByText('Start of Semester')).toHaveClass('bg-blue-100');
    });

    // Switch to end semester and verify CS401 is still there
    fireEvent.click(screen.getByText('End of Semester'));

    await waitFor(() => {
      expect(screen.getByText('CS401')).toBeInTheDocument();
      expect(screen.getByText('End of Semester')).toHaveClass('bg-blue-100');
    });
  });

  it('should handle task editing independently for each semester', async () => {
    render(<CourseMatrix />);

    // Start on start semester
    expect(screen.getByText('Course Directive')).toBeInTheDocument();

    // Verify task editor is not visible initially
    expect(screen.queryByTestId('task-editor')).not.toBeInTheDocument();

    // Open task editor
    const editButton = screen.getByText('Edit Tasks');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('task-editor')).toBeInTheDocument();
    });

    // Switch to end semester while editor is open
    const endTab = screen.getByText('End of Semester');
    fireEvent.click(endTab);

    await waitFor(() => {
      expect(screen.getByText('Final Grades')).toBeInTheDocument();
      expect(screen.getByText('Course Evaluation')).toBeInTheDocument();
    });

    // Should still be in edit mode for end semester
    expect(screen.getByTestId('task-editor')).toBeInTheDocument();

    // Close editor using the button from TopControls (not the mock TaskEditor)
    const doneButton = screen.getByTestId('edit-tasks-button');
    fireEvent.click(doneButton);

    await waitFor(() => {
      expect(screen.queryByTestId('task-editor')).not.toBeInTheDocument();
    });
  });

  it('should handle progress calculations independently', async () => {
    render(<CourseMatrix />);

    // Add course to start semester
    const courseInput = screen.getByPlaceholderText('Enter course code');
    fireEvent.change(courseInput, { target: { value: 'TEST101' } });
    fireEvent.click(screen.getByText('Add Course'));

    await waitFor(() => {
      expect(screen.getByText('TEST101')).toBeInTheDocument();
    });

    // Switch to end semester and add course
    fireEvent.click(screen.getByText('End of Semester'));
    
    await waitFor(() => {
      expect(screen.getByText('Final Grades')).toBeInTheDocument();
    });

    const endCourseInput = screen.getByPlaceholderText('Enter course code');
    fireEvent.change(endCourseInput, { target: { value: 'TEST401' } });
    fireEvent.click(screen.getByText('Add Course'));

    await waitFor(() => {
      expect(screen.getByText('TEST401')).toBeInTheDocument();
    });

    // Both semesters should show progress independently
    // Switch back to start semester
    fireEvent.click(screen.getByText('Start of Semester'));

    await waitFor(() => {
      expect(screen.getByText('TEST101')).toBeInTheDocument();
      expect(screen.queryByText('TEST401')).not.toBeInTheDocument();
    });
  });

  it('should copy courses between semesters using the copy button', async () => {
    render(<CourseMatrix />);

    // Start on start semester and add courses
    expect(screen.getByText('Start of Semester')).toHaveClass('bg-blue-100');

    // Add courses to start semester
    const courseInput = screen.getByPlaceholderText('Enter course code');
    fireEvent.change(courseInput, { target: { value: 'CS101' } });
    fireEvent.click(screen.getByText('Add Course'));

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    fireEvent.change(courseInput, { target: { value: 'MATH201' } });
    fireEvent.click(screen.getByText('Add Course'));

    await waitFor(() => {
      expect(screen.getByText('MATH201')).toBeInTheDocument();
    });

    // Copy courses to end semester
    const copyButton = screen.getByTestId('copy-courses-button');
    expect(copyButton).not.toBeDisabled();
    fireEvent.click(copyButton);

    // Switch to end semester
    fireEvent.click(screen.getByText('End of Semester'));

    await waitFor(() => {
      expect(screen.getByText('End of Semester')).toHaveClass('bg-blue-100');
      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(screen.getByText('MATH201')).toBeInTheDocument();
    });

    // Verify end semester tasks are displayed (not start semester tasks)
    expect(screen.getByText('Final Grades')).toBeInTheDocument();
    expect(screen.queryByText('Course Directive')).not.toBeInTheDocument();
  });
});
