import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskEditor from '../components/TaskEditor';

// Mock the UI components to avoid complexity in testing
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ 
    children, 
    onClick, 
    variant, 
    size,
    ...props 
  }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    variant?: string; 
    size?: string;
  }) => (
    <button 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">×</span>,
  GripVertical: () => <span data-testid="grip-icon">≡</span>,
}));

describe('TaskEditor', () => {
  const mockTasks = {
    'Course Setup': ['Create syllabus', 'Setup Moodle'],
    'Grading': ['Setup rubric', 'Configure gradebook'],
  };

  const mockOnTasksChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a new task type when form is submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        isVisible={true}
      />
    );

    // Find the "New Task Type" input
    const taskTypeInput = screen.getByPlaceholderText('New Task Type');
    const addTaskButton = screen.getByRole('button', { name: /add task type/i });

    // Type a new task type
    await user.type(taskTypeInput, 'New Task Category');
    
    // Click the add button
    await user.click(addTaskButton);

    // Verify the callback was called with the new task type
    expect(mockOnTasksChange).toHaveBeenCalledWith({
      ...mockTasks,
      'New Task Category': []
    });
  });

  it('should add a subtask to an existing task type', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        isVisible={true}
      />
    );

    // Find subtask input for the first task type (Course Setup)
    const subtaskInputs = screen.getAllByPlaceholderText('New Subtask');
    const addSubtaskButtons = screen.getAllByRole('button', { name: /^add$/i });

    // Type a new subtask for the first task type
    await user.type(subtaskInputs[0], 'New subtask item');
    
    // Click the corresponding add button
    await user.click(addSubtaskButtons[0]);

    // Verify the callback was called with the new subtask added to the first task type
    expect(mockOnTasksChange).toHaveBeenCalledWith({
      ...mockTasks,
      'Course Setup': [...mockTasks['Course Setup'], 'New subtask item']
    });
  });

  it('should remove a task type when remove button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        isVisible={true}
      />
    );

    // Find and click the remove button for the first task type
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    // Verify the callback was called with the task type removed
    const expectedTasks = { ...mockTasks };
    const { 'Course Setup': removed, ...remainingTasks } = expectedTasks;
    
    expect(mockOnTasksChange).toHaveBeenCalledWith(remainingTasks);
  });

  it('should remove a subtask when its remove button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        isVisible={true}
      />
    );

    // Find all X icons (subtask remove buttons) and click the first one
    const subtaskRemoveButtons = screen.getAllByTestId('x-icon');
    const removeButton = subtaskRemoveButtons[0].closest('button');
    
    if (removeButton) {
      await user.click(removeButton);
    }

    // Verify the callback was called with the first subtask removed from the first task type
    expect(mockOnTasksChange).toHaveBeenCalledWith({
      ...mockTasks,
      'Course Setup': ['Setup Moodle'] // First subtask 'Create syllabus' should be removed
    });
  });

  it('should not render when isVisible is false', () => {
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        isVisible={false}
      />
    );

    // The component should not render anything when not visible
    expect(screen.queryByText('Edit Tasks')).toBeNull();
  });

  it('should display all existing task types and subtasks', () => {
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        isVisible={true}
      />
    );

    // Check that all task types are displayed
    expect(screen.getByText('Course Setup')).toBeTruthy();
    expect(screen.getByText('Grading')).toBeTruthy();

    // Check that all subtasks are displayed
    expect(screen.getByText('Create syllabus')).toBeTruthy();
    expect(screen.getByText('Setup Moodle')).toBeTruthy();
    expect(screen.getByText('Setup rubric')).toBeTruthy();
    expect(screen.getByText('Configure gradebook')).toBeTruthy();
  });

  it('should clear input after adding a task type', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        isVisible={true}
      />
    );

    const taskTypeInput = screen.getByPlaceholderText('New Task Type') as HTMLInputElement;
    const addTaskButton = screen.getByRole('button', { name: /add task type/i });

    // Type and add a new task type
    await user.type(taskTypeInput, 'Test Task');
    await user.click(addTaskButton);

    // The input should be cleared after adding
    expect(taskTypeInput.value).toBe('');
  });

  it('should keep subtask inputs independent for each task type', async () => {
    const user = userEvent.setup();
    
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        isVisible={true}
      />
    );

    // Find all subtask inputs
    const subtaskInputs = screen.getAllByPlaceholderText('New Subtask') as HTMLInputElement[];
    
    // Type different text in each input
    await user.type(subtaskInputs[0], 'First task subtask');
    await user.type(subtaskInputs[1], 'Second task subtask');

    // Verify that each input has its own value
    expect(subtaskInputs[0].value).toBe('First task subtask');
    expect(subtaskInputs[1].value).toBe('Second task subtask');
    
    // Make sure the values didn't interfere with each other
    expect(subtaskInputs[0].value).not.toBe(subtaskInputs[1].value);
  });
});
