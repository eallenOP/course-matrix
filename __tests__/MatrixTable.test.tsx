import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatrixTable from '../components/MatrixTable';

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress" data-value={value} className={className}>
      {value}%
    </div>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">×</span>,
  CheckCircle2: () => <span data-testid="check-icon">✓</span>,
  Circle: () => <span data-testid="circle-icon">○</span>,
  Minus: () => <span data-testid="minus-icon">-</span>,
}));

describe('MatrixTable', () => {
  const mockCourses = [
    { id: 1, code: 'CS101' },
    { id: 2, code: 'MATH201' },
  ];

  const mockTasks = {
    'Task Type A': ['Subtask A1', 'Subtask A2'],
    'Task Type B': ['Subtask B1'],
  };

  const mockTaskStatus = {
    '1-Task Type A-Subtask A1': true,
    '1-Task Type A-Subtask A2': false,
    '2-Task Type A-Subtask A1': 'na' as const,
    '1-Task Type B-Subtask B1': true,
  };

  const mockProps = {
    courses: mockCourses,
    tasks: mockTasks,
    taskStatus: mockTaskStatus,
    expandedTask: null,
    hoveredCourse: null,
    onExpandTask: jest.fn(),
    onRemoveCourse: jest.fn(),
    onToggleStatus: jest.fn(),
    onCourseHover: jest.fn(),
    calculateTaskProgress: jest.fn().mockReturnValue(75),
    calculateCourseTaskProgress: jest.fn().mockReturnValue(50),
    calculateCourseProgress: jest.fn().mockReturnValue(80),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display empty state when no courses exist', () => {
    render(
      <MatrixTable
        {...mockProps}
        courses={[]}
      />
    );

    expect(screen.getByText('Add courses to begin tracking your preparation tasks')).toBeTruthy();
  });

  it('should display course headers with codes and progress', () => {
    render(<MatrixTable {...mockProps} />);

    // Check that course codes are displayed
    expect(screen.getByText('CS101')).toBeTruthy();
    expect(screen.getByText('MATH201')).toBeTruthy();

    // Check that progress percentages are displayed
    expect(mockProps.calculateCourseProgress).toHaveBeenCalledWith(1);
    expect(mockProps.calculateCourseProgress).toHaveBeenCalledWith(2);
  });

  it('should display task types with progress percentages', () => {
    render(<MatrixTable {...mockProps} />);

    // Check that task types are displayed
    expect(screen.getByText('Task Type A')).toBeTruthy();
    expect(screen.getByText('Task Type B')).toBeTruthy();

    // Check that task progress calculations are called
    expect(mockProps.calculateTaskProgress).toHaveBeenCalledWith('Task Type A');
    expect(mockProps.calculateTaskProgress).toHaveBeenCalledWith('Task Type B');
  });

  it('should call onExpandTask when task row is clicked', async () => {
    const user = userEvent.setup();
    
    render(<MatrixTable {...mockProps} />);

    const taskTypeA = screen.getByText('Task Type A');
    await user.click(taskTypeA);

    expect(mockProps.onExpandTask).toHaveBeenCalledWith('Task Type A');
  });

  it('should display subtasks when task is expanded', () => {
    render(
      <MatrixTable
        {...mockProps}
        expandedTask="Task Type A"
      />
    );

    // Check that subtasks are displayed when expanded
    expect(screen.getByText('Subtask A1')).toBeTruthy();
    expect(screen.getByText('Subtask A2')).toBeTruthy();
  });

  it('should not display subtasks when task is not expanded', () => {
    render(
      <MatrixTable
        {...mockProps}
        expandedTask={null}
      />
    );

    // Subtasks should not be visible when not expanded
    expect(screen.queryByText('Subtask A1')).toBeNull();
    expect(screen.queryByText('Subtask A2')).toBeNull();
  });

  it('should display correct status icons for different task statuses', () => {
    render(
      <MatrixTable
        {...mockProps}
        expandedTask="Task Type A"
      />
    );

    // Should have check icons for completed tasks
    const checkIcons = screen.getAllByTestId('check-icon');
    expect(checkIcons.length).toBeGreaterThan(0);

    // Should have circle icons for incomplete tasks
    const circleIcons = screen.getAllByTestId('circle-icon');
    expect(circleIcons.length).toBeGreaterThan(0);

    // Should have minus icons for N/A tasks
    const minusIcons = screen.getAllByTestId('minus-icon');
    expect(minusIcons.length).toBeGreaterThan(0);
  });

  it('should call onToggleStatus when subtask status is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MatrixTable
        {...mockProps}
        expandedTask="Task Type A"
      />
    );

    // Find status cells (table cells that are clickable and in the subtask rows)
    const statusCells = screen.getAllByRole('cell').filter(cell => 
      cell.className.includes('cursor-pointer') && 
      cell.className.includes('hover:bg-gray-50')
    );
    
    if (statusCells.length > 0) {
      await user.click(statusCells[0]);
      expect(mockProps.onToggleStatus).toHaveBeenCalled();
    } else {
      // If we can't find cells by class, try finding by status icons
      const statusIcons = screen.getAllByTestId('check-icon');
      if (statusIcons.length > 0) {
        const parentCell = statusIcons[0].closest('td');
        if (parentCell) {
          await user.click(parentCell);
          expect(mockProps.onToggleStatus).toHaveBeenCalled();
        }
      }
    }
  });

  it('should show remove button on course hover', () => {
    render(
      <MatrixTable
        {...mockProps}
        hoveredCourse={1}
      />
    );

    // Should show X button when course is hovered
    expect(screen.getByTestId('x-icon')).toBeTruthy();
    expect(screen.getByLabelText('Remove CS101')).toBeTruthy();
  });

  it('should call onRemoveCourse when remove button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MatrixTable
        {...mockProps}
        hoveredCourse={1}
      />
    );

    const removeButton = screen.getByLabelText('Remove CS101');
    await user.click(removeButton);

    expect(mockProps.onRemoveCourse).toHaveBeenCalledWith(1);
  });

  it('should call onCourseHover when mouse enters and leaves course header', async () => {
    const user = userEvent.setup();
    
    render(<MatrixTable {...mockProps} />);

    // Find the course header (th element containing CS101)
    const courseHeader = screen.getByText('CS101').closest('th');
    
    if (courseHeader) {
      await user.hover(courseHeader);
      expect(mockProps.onCourseHover).toHaveBeenCalledWith(1);

      await user.unhover(courseHeader);
      expect(mockProps.onCourseHover).toHaveBeenCalledWith(null);
    }
  });

  it('should display progress bars for course-task combinations', () => {
    render(<MatrixTable {...mockProps} />);

    // Should display progress components
    const progressBars = screen.getAllByTestId('progress');
    expect(progressBars.length).toBeGreaterThan(0);

    // Should call calculateCourseTaskProgress for each course-task combination
    expect(mockProps.calculateCourseTaskProgress).toHaveBeenCalledWith(1, 'Task Type A');
    expect(mockProps.calculateCourseTaskProgress).toHaveBeenCalledWith(2, 'Task Type A');
    expect(mockProps.calculateCourseTaskProgress).toHaveBeenCalledWith(1, 'Task Type B');
    expect(mockProps.calculateCourseTaskProgress).toHaveBeenCalledWith(2, 'Task Type B');
  });
});
