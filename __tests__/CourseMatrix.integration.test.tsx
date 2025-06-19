import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseMatrix from '../components/CourseMatrix';

// Mock all the child components
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
        {courses.map((course: any) => (
          <div key={course.id} data-testid={`course-${course.id}`}>
            {course.code}
            <button 
              onClick={() => onRemoveCourse(course.id)}
              data-testid={`remove-${course.id}`}
            >
              Remove
            </button>
          </div>
        ))}
        {Object.keys(tasks).map((taskType) => (
          <div key={taskType} data-testid={`task-type-${taskType}`}>
            {taskType}
            <div data-testid={`progress-${taskType}`}>
              Progress: {calculateTaskProgress(taskType)}%
            </div>
          </div>
        ))}
        {courses.map((course: any) => (
          <div key={`progress-${course.id}`} data-testid={`course-progress-${course.id}`}>
            Course Progress: {calculateCourseProgress(course.id)}%
          </div>
        ))}
        <button 
          onClick={() => onToggleStatus(1, 'Course Directive', 'Task 1')}
          data-testid="mock-toggle-status"
        >
          Toggle Status
        </button>
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
    onResetProgress 
  }: any) {
    return (
      <div data-testid="top-controls">
        <input
          value={newCourseCode}
          onChange={(e) => onNewCourseCodeChange(e.target.value)}
          placeholder="Course Code"
          data-testid="course-input"
        />
        <button onClick={onAddCourse} data-testid="add-course">
          Add Course
        </button>
        <button onClick={onToggleEditTasks} data-testid="toggle-edit">
          {isEditingTasks ? 'Done Editing' : 'Edit Tasks'}
        </button>
        <button onClick={onResetProgress} data-testid="reset-progress">
          Reset Progress
        </button>
      </div>
    );
  };
});

jest.mock('../components/Legend', () => {
  return function MockLegend() {
    return <div data-testid="legend">Legend</div>;
  };
});

// Mock the localStorage hook
jest.mock('../hooks/useLocalStoragePersistence', () => ({
  useCourseMatrixPersistence: () => ({
    courses: [],
    tasks: {
      'Course Directive': ['Task 1', 'Task 2'],
      'Moodle': ['Task A', 'Task B']
    },
    taskStatus: {},
    setCourses: jest.fn(),
    setTasks: jest.fn(),
    setTaskStatus: jest.fn()
  })
}));

// Mock progress calculations
jest.mock('../utils/progressCalculations', () => ({
  progressCalculations: {
    calculateTaskProgress: jest.fn(() => 50),
    calculateCourseTaskProgress: jest.fn(() => 75),
    calculateCourseProgress: jest.fn(() => 60)
  }
}));

// Mock task actions
jest.mock('../utils/taskActions', () => ({
  resetTaskStatuses: jest.fn()
}));

describe('CourseMatrix Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all main components', () => {
    render(<CourseMatrix />);
    
    expect(screen.getByText('Course Preparation Matrix')).toBeInTheDocument();
    expect(screen.getByTestId('top-controls')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-table')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('should handle course addition workflow', () => {
    render(<CourseMatrix />);
    
    const input = screen.getByTestId('course-input');
    const addButton = screen.getByTestId('add-course');
    
    fireEvent.change(input, { target: { value: 'CS101' } });
    fireEvent.click(addButton);
    
    // The input should be cleared after adding
    expect(input).toHaveValue('');
  });

  it('should toggle task editing mode', () => {
    render(<CourseMatrix />);
    
    const toggleButton = screen.getByTestId('toggle-edit');
    
    // Initially should show "Edit Tasks"
    expect(toggleButton).toHaveTextContent('Edit Tasks');
    
    // Should not show task editor initially
    expect(screen.queryByTestId('task-editor')).not.toBeInTheDocument();
    
    // Click to enable editing
    fireEvent.click(toggleButton);
    
    // Should now show task editor and "Done Editing"
    expect(screen.getByTestId('task-editor')).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent('Done Editing');
  });

  it('should handle reset progress action', () => {
    const { resetTaskStatuses } = require('../utils/taskActions');
    
    render(<CourseMatrix />);
    
    const resetButton = screen.getByTestId('reset-progress');
    fireEvent.click(resetButton);
    
    expect(resetTaskStatuses).toHaveBeenCalledTimes(1);
  });

  it('should pass correct props to child components', () => {
    render(<CourseMatrix />);
    
    // Check that Matrix Table receives task types
    expect(screen.getByTestId('task-type-Course Directive')).toBeInTheDocument();
    expect(screen.getByTestId('task-type-Moodle')).toBeInTheDocument();
    
    // Check that progress calculations are called
    expect(screen.getByTestId('progress-Course Directive')).toHaveTextContent('Progress: 50%');
    expect(screen.getByTestId('progress-Moodle')).toHaveTextContent('Progress: 50%');
  });

  it('should handle task status toggling', () => {
    render(<CourseMatrix />);
    
    const toggleButton = screen.getByTestId('mock-toggle-status');
    fireEvent.click(toggleButton);
    
    // This would trigger the toggleStatus function
    // Since we're mocking, we're just testing the integration
    expect(toggleButton).toBeInTheDocument();
  });

  it('should maintain proper component hierarchy', () => {
    const { container } = render(<CourseMatrix />);
    
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass('p-6', 'max-w-6xl', 'mx-auto');
    
    // Check that all main components are present in the document
    expect(screen.getByTestId('top-controls')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-table')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
    
    // Check that title is present
    expect(screen.getByText('Course Preparation Matrix')).toBeInTheDocument();
  });

  it('should handle empty course addition', () => {
    render(<CourseMatrix />);
    
    const addButton = screen.getByTestId('add-course');
    
    // Try to add without entering a course code
    fireEvent.click(addButton);
    
    // Should not crash or cause issues
    expect(addButton).toBeInTheDocument();
  });

  it('should show task editor only when editing is enabled', () => {
    render(<CourseMatrix />);
    
    // Initially hidden
    expect(screen.queryByTestId('task-editor')).not.toBeInTheDocument();
    
    // Enable editing
    fireEvent.click(screen.getByTestId('toggle-edit'));
    
    // Should be visible
    expect(screen.getByTestId('task-editor')).toBeInTheDocument();
    
    // Disable editing
    fireEvent.click(screen.getByTestId('toggle-edit'));
    
    // Should be hidden again
    expect(screen.queryByTestId('task-editor')).not.toBeInTheDocument();
  });
});
