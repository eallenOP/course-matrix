import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  const mockDefaultTasks = {
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
        defaultTasks={mockDefaultTasks}
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
        defaultTasks={mockDefaultTasks}
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
        defaultTasks={mockDefaultTasks}
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
        defaultTasks={mockDefaultTasks}
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
        defaultTasks={mockDefaultTasks}
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
        defaultTasks={mockDefaultTasks}
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
        defaultTasks={mockDefaultTasks}
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
        defaultTasks={mockDefaultTasks}
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

  it('should add a task type when Enter key is pressed in task type input', async () => {
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        defaultTasks={mockDefaultTasks}
        isVisible={true}
      />
    );

    const taskTypeInput = screen.getByPlaceholderText('New Task Type');
    
    fireEvent.change(taskTypeInput, { target: { value: 'Keyboard Task' } });
    fireEvent.keyDown(taskTypeInput, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnTasksChange).toHaveBeenCalledWith({
        ...mockTasks,
        'Keyboard Task': []
      });
    });
  });

  it('should add a subtask when Enter key is pressed in subtask input', async () => {
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        defaultTasks={mockDefaultTasks}
        isVisible={true}
      />
    );

    // Find the first subtask input (for Course Setup)
    const subtaskInputs = screen.getAllByPlaceholderText('New Subtask');
    const firstSubtaskInput = subtaskInputs[0];
    
    fireEvent.change(firstSubtaskInput, { target: { value: 'Keyboard Subtask' } });
    fireEvent.keyDown(firstSubtaskInput, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnTasksChange).toHaveBeenCalledWith({
        ...mockTasks,
        'Course Setup': [...mockTasks['Course Setup'], 'Keyboard Subtask']
      });
    });
  });

  it('should not trigger actions when non-Enter keys are pressed', () => {
    render(
      <TaskEditor
        tasks={mockTasks}
        onTasksChange={mockOnTasksChange}
        defaultTasks={mockDefaultTasks}
        isVisible={true}
      />
    );

    const taskTypeInput = screen.getByPlaceholderText('New Task Type');
    const subtaskInputs = screen.getAllByPlaceholderText('New Subtask');
    
    // Test various keys that should NOT trigger actions
    ['Space', 'Tab', 'Escape', 'ArrowDown', 'Backspace'].forEach(key => {
      fireEvent.keyDown(taskTypeInput, { key });
      fireEvent.keyDown(subtaskInputs[0], { key });
    });

    expect(mockOnTasksChange).not.toHaveBeenCalled();
  });

  describe('Inline Editing', () => {
    it('should allow editing task type name by clicking on it', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskEditor
          tasks={mockTasks}
          onTasksChange={mockOnTasksChange}
          defaultTasks={mockDefaultTasks}
          isVisible={true}
        />
      );

      // Click on the first task type name to edit it
      const taskTypeName = screen.getByText('Course Setup');
      await user.click(taskTypeName);

      // Should show an input field
      const editInput = screen.getByDisplayValue('Course Setup');
      expect(editInput).toBeTruthy();

      // Edit the task type name
      await user.clear(editInput);
      await user.type(editInput, 'Updated Course Setup');
      
      // Press Enter to save
      fireEvent.keyDown(editInput, { key: 'Enter' });

      // Verify the callback was called with the updated task type
      await waitFor(() => {
        expect(mockOnTasksChange).toHaveBeenCalledWith({
          'Updated Course Setup': mockTasks['Course Setup'],
          'Grading': mockTasks['Grading']
        });
      });
    });

    it('should cancel task type editing when Escape is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskEditor
          tasks={mockTasks}
          onTasksChange={mockOnTasksChange}
          defaultTasks={mockDefaultTasks}
          isVisible={true}
        />
      );

      // Click on task type to edit
      const taskTypeName = screen.getByText('Course Setup');
      await user.click(taskTypeName);

      // Edit the value
      const editInput = screen.getByDisplayValue('Course Setup');
      await user.clear(editInput);
      await user.type(editInput, 'Changed Name');
      
      // Press Escape to cancel
      fireEvent.keyDown(editInput, { key: 'Escape' });

      // Should not call onTasksChange
      expect(mockOnTasksChange).not.toHaveBeenCalled();
      
      // Should show original task type name again
      expect(screen.getByText('Course Setup')).toBeTruthy();
    });

    it('should allow editing subtask text by clicking on it', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskEditor
          tasks={mockTasks}
          onTasksChange={mockOnTasksChange}
          defaultTasks={mockDefaultTasks}
          isVisible={true}
        />
      );

      // Click on the first subtask to edit it
      const subtaskText = screen.getByText('Create syllabus');
      await user.click(subtaskText);

      // Should show an input field
      const editInput = screen.getByDisplayValue('Create syllabus');
      expect(editInput).toBeTruthy();

      // Edit the subtask text
      await user.clear(editInput);
      await user.type(editInput, 'Updated syllabus');
      
      // Press Enter to save
      fireEvent.keyDown(editInput, { key: 'Enter' });

      // Verify the callback was called with the updated subtask
      await waitFor(() => {
        expect(mockOnTasksChange).toHaveBeenCalledWith({
          ...mockTasks,
          'Course Setup': ['Updated syllabus', 'Setup Moodle']
        });
      });
    });

    it('should cancel subtask editing when Escape is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskEditor
          tasks={mockTasks}
          onTasksChange={mockOnTasksChange}
          defaultTasks={mockDefaultTasks}
          isVisible={true}
        />
      );

      // Click on subtask to edit
      const subtaskText = screen.getByText('Create syllabus');
      await user.click(subtaskText);

      // Edit the value
      const editInput = screen.getByDisplayValue('Create syllabus');
      await user.clear(editInput);
      await user.type(editInput, 'Changed Text');
      
      // Press Escape to cancel
      fireEvent.keyDown(editInput, { key: 'Escape' });

      // Should not call onTasksChange
      expect(mockOnTasksChange).not.toHaveBeenCalled();
      
      // Should show original subtask text again
      expect(screen.getByText('Create syllabus')).toBeTruthy();
    });

    it('should save task type edit when input loses focus', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskEditor
          tasks={mockTasks}
          onTasksChange={mockOnTasksChange}
          defaultTasks={mockDefaultTasks}
          isVisible={true}
        />
      );

      // Click on task type to edit
      const taskTypeName = screen.getByText('Course Setup');
      await user.click(taskTypeName);

      // Edit the value
      const editInput = screen.getByDisplayValue('Course Setup');
      await user.clear(editInput);
      await user.type(editInput, 'Blurred Task Type');
      
      // Blur the input (simulate clicking outside)
      fireEvent.blur(editInput);

      // Verify the callback was called
      await waitFor(() => {
        expect(mockOnTasksChange).toHaveBeenCalledWith({
          'Blurred Task Type': mockTasks['Course Setup'],
          'Grading': mockTasks['Grading']
        });
      });
    });

    it('should save subtask edit when input loses focus', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskEditor
          tasks={mockTasks}
          onTasksChange={mockOnTasksChange}
          defaultTasks={mockDefaultTasks}
          isVisible={true}
        />
      );

      // Click on subtask to edit
      const subtaskText = screen.getByText('Create syllabus');
      await user.click(subtaskText);

      // Edit the value
      const editInput = screen.getByDisplayValue('Create syllabus');
      await user.clear(editInput);
      await user.type(editInput, 'Blurred subtask');
      
      // Blur the input (simulate clicking outside)
      fireEvent.blur(editInput);

      // Verify the callback was called
      await waitFor(() => {
        expect(mockOnTasksChange).toHaveBeenCalledWith({
          ...mockTasks,
          'Course Setup': ['Blurred subtask', 'Setup Moodle']
        });
      });
    });

    it('should not save changes if text is empty or unchanged', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskEditor
          tasks={mockTasks}
          onTasksChange={mockOnTasksChange}
          defaultTasks={mockDefaultTasks}
          isVisible={true}
        />
      );

      // Test empty task type
      const taskTypeName = screen.getByText('Course Setup');
      await user.click(taskTypeName);
      const taskTypeInput = screen.getByDisplayValue('Course Setup');
      await user.clear(taskTypeInput);
      fireEvent.keyDown(taskTypeInput, { key: 'Enter' });
      
      // Should not call onTasksChange for empty value
      expect(mockOnTasksChange).not.toHaveBeenCalled();

      // Test unchanged task type
      const unchanged = screen.getByText('Course Setup');
      await user.click(unchanged);
      const unchangedInput = screen.getByDisplayValue('Course Setup');
      fireEvent.keyDown(unchangedInput, { key: 'Enter' });
      
      // Should not call onTasksChange for unchanged value
      expect(mockOnTasksChange).not.toHaveBeenCalled();
    });

    it('should disable dragging when editing a subtask', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskEditor
          tasks={mockTasks}
          onTasksChange={mockOnTasksChange}
          defaultTasks={mockDefaultTasks}
          isVisible={true}
        />
      );

      // Click on subtask to edit
      const subtaskText = screen.getByText('Create syllabus');
      await user.click(subtaskText);

      // Find the container div that has the draggable attribute
      const editingContainer = screen.getByDisplayValue('Create syllabus').closest('[draggable]');
      expect(editingContainer).toHaveAttribute('draggable', 'false');
    });

    it('should preserve task type order when editing task type name', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskEditor
          tasks={mockTasks}
          onTasksChange={mockOnTasksChange}
          defaultTasks={mockDefaultTasks}
          isVisible={true}
        />
      );

      // Click on the first task type to edit it
      const taskTypeName = screen.getByText('Course Setup');
      await user.click(taskTypeName);

      // Edit the task type name
      const editInput = screen.getByDisplayValue('Course Setup');
      await user.clear(editInput);
      await user.type(editInput, 'Updated Course Setup');
      
      // Press Enter to save
      fireEvent.keyDown(editInput, { key: 'Enter' });

      // Verify the callback was called with the task types in the same order
      await waitFor(() => {
        expect(mockOnTasksChange).toHaveBeenCalledWith({
          'Updated Course Setup': mockTasks['Course Setup'], // First position preserved
          'Grading': mockTasks['Grading'] // Second position preserved
        });
      });
      
      // Verify the order by checking the keys array
      const lastCall = mockOnTasksChange.mock.calls[mockOnTasksChange.mock.calls.length - 1][0];
      const taskTypeKeys = Object.keys(lastCall);
      expect(taskTypeKeys).toEqual(['Updated Course Setup', 'Grading']);
    });
  });
});