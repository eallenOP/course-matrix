import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopControls from '../components/TopControls';

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-variant={variant}
    >
      {children}
    </button>
  )
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  PlusCircle: () => <span data-testid="plus-icon">+</span>,
  Settings: () => <span data-testid="settings-icon">⚙</span>,
  Copy: () => <span data-testid="copy-icon">📋</span>,
  Check: () => <span data-testid="check-icon">✓</span>,
  Download: () => <span data-testid="download-icon">⬇</span>
}));

describe('TopControls', () => {
  const defaultProps = {
    newCourseCode: '',
    onNewCourseCodeChange: jest.fn(),
    onAddCourse: jest.fn(),
    isEditingTasks: false,
    onToggleEditTasks: jest.fn(),
    onResetProgress: jest.fn(),
    activeSemester: 'start' as const,
    currentSemesterCourseCount: 0,
    otherSemesterCourseCount: 0,
    onCopyCourses: jest.fn(),
    tasks: {
      'Course Directive': ['Task 1', 'Task 2'],
      'Moodle': ['Task A', 'Task B']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all control elements', () => {
    render(<TopControls {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Course Code')).toBeInTheDocument();
    expect(screen.getByText('Add Course')).toBeInTheDocument();
    expect(screen.getByText('Download Tasks')).toBeInTheDocument();
    expect(screen.getByText('Edit Tasks')).toBeInTheDocument();
    expect(screen.getByText('Reset Progress')).toBeInTheDocument();
  });

  it('should display the current course code value', () => {
    render(<TopControls {...defaultProps} newCourseCode="CS101" />);
    
    const input = screen.getByPlaceholderText('Course Code') as HTMLInputElement;
    expect(input.value).toBe('CS101');
  });

  it('should call onNewCourseCodeChange when input value changes', () => {
    render(<TopControls {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Course Code');
    fireEvent.change(input, { target: { value: 'CS202' } });
    
    expect(defaultProps.onNewCourseCodeChange).toHaveBeenCalledWith('CS202');
  });

  it('should call onAddCourse when Add Course button is clicked', () => {
    render(<TopControls {...defaultProps} />);
    
    const addButton = screen.getByText('Add Course');
    fireEvent.click(addButton);
    
    expect(defaultProps.onAddCourse).toHaveBeenCalledTimes(1);
  });

  it('should display "Edit Tasks" when not editing', () => {
    render(<TopControls {...defaultProps} isEditingTasks={false} />);
    
    expect(screen.getByText('Edit Tasks')).toBeInTheDocument();
  });

  it('should display "Done Editing" when editing tasks', () => {
    render(<TopControls {...defaultProps} isEditingTasks={true} />);
    
    expect(screen.getByText('Done Editing')).toBeInTheDocument();
  });

  it('should call onToggleEditTasks when edit button is clicked', () => {
    render(<TopControls {...defaultProps} />);
    
    const editButton = screen.getByText('Edit Tasks');
    fireEvent.click(editButton);
    
    expect(defaultProps.onToggleEditTasks).toHaveBeenCalledTimes(1);
  });

  it('should call onResetProgress when reset button is clicked', () => {
    render(<TopControls {...defaultProps} />);
    
    const resetButton = screen.getByText('Reset Progress');
    fireEvent.click(resetButton);
    
    expect(defaultProps.onResetProgress).toHaveBeenCalledTimes(1);
  });

  it('should render icons correctly', () => {
    render(<TopControls {...defaultProps} />);
    
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
  });

  it('should apply correct button variants', () => {
    render(<TopControls {...defaultProps} />);
    
    const editButton = screen.getByText('Edit Tasks').closest('button');
    const resetButton = screen.getByText('Reset Progress').closest('button');
    
    expect(editButton).toHaveAttribute('data-variant', 'outline');
    expect(resetButton).toHaveAttribute('data-variant', 'destructive');
  });

  it('should have proper layout structure', () => {
    render(<TopControls {...defaultProps} />);
    
    const container = screen.getByText('Add Course').closest('div');
    expect(container?.parentElement).toHaveClass('flex');
  });

  it('should call onAddCourse when Enter key is pressed in course code input', () => {
    render(<TopControls {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Course Code');
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(defaultProps.onAddCourse).toHaveBeenCalledTimes(1);
  });

  it('should not call onAddCourse when other keys are pressed in course code input', () => {
    render(<TopControls {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Course Code');
    fireEvent.keyDown(input, { key: 'Space' });
    fireEvent.keyDown(input, { key: 'Tab' });
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(defaultProps.onAddCourse).not.toHaveBeenCalled();
  });

  it('should show "Copied!" feedback when copy button is clicked', () => {
    render(<TopControls {...defaultProps} currentSemesterCourseCount={2} />);
    
    // Initially should show copy text
    expect(screen.getByText(/Copy to End/)).toBeInTheDocument();
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    
    // Click the copy button
    const copyButton = screen.getByText(/Copy to End/);
    fireEvent.click(copyButton);
    
    // Should show feedback
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(defaultProps.onCopyCourses).toHaveBeenCalledTimes(1);
  });

  it('should render download button', () => {
    render(<TopControls {...defaultProps} />);
    
    const downloadButton = screen.getByText('Download Tasks');
    expect(downloadButton).toBeInTheDocument();
    expect(screen.getByTestId('download-icon')).toBeInTheDocument();
  });
});
