import { resetTaskStatuses } from '../utils/taskActions';
import { Course, TaskStatus, Tasks } from '../types/course';

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

describe('taskActions', () => {
  const mockCourses: Course[] = [
    { id: 1, code: 'CS101' },
    { id: 2, code: 'CS102' }
  ];

  const mockTasks: Tasks = {
    'Course Directive': ['Task 1', 'Task 2'],
    'Moodle': ['Task A', 'Task B']
  };

  const mockSetTaskStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resetTaskStatuses', () => {
    it('should call confirm dialog with appropriate message', () => {
      mockConfirm.mockReturnValue(false);
      
      resetTaskStatuses(mockCourses, mockTasks, mockSetTaskStatus);
      
      expect(mockConfirm).toHaveBeenCalledWith(
        "Are you sure you want to reset all tasks to unchecked?"
      );
    });

    it('should not reset when user cancels confirmation', () => {
      mockConfirm.mockReturnValue(false);
      
      resetTaskStatuses(mockCourses, mockTasks, mockSetTaskStatus);
      
      expect(mockSetTaskStatus).not.toHaveBeenCalled();
    });

    it('should reset all task statuses when user confirms', () => {
      mockConfirm.mockReturnValue(true);
      
      resetTaskStatuses(mockCourses, mockTasks, mockSetTaskStatus);
      
      expect(mockSetTaskStatus).toHaveBeenCalledTimes(1);
      
      const resetStatus = mockSetTaskStatus.mock.calls[0][0];
      const expectedKeys = [
        '1-Course Directive-Task 1',
        '1-Course Directive-Task 2',
        '1-Moodle-Task A',
        '1-Moodle-Task B',
        '2-Course Directive-Task 1',
        '2-Course Directive-Task 2',
        '2-Moodle-Task A',
        '2-Moodle-Task B'
      ];
      
      expectedKeys.forEach(key => {
        expect(resetStatus[key]).toBe(false);
      });
    });

    it('should handle empty courses array', () => {
      mockConfirm.mockReturnValue(true);
      
      resetTaskStatuses([], mockTasks, mockSetTaskStatus);
      
      expect(mockSetTaskStatus).toHaveBeenCalledWith({});
    });

    it('should handle empty tasks object', () => {
      mockConfirm.mockReturnValue(true);
      
      resetTaskStatuses(mockCourses, {}, mockSetTaskStatus);
      
      expect(mockSetTaskStatus).toHaveBeenCalledWith({});
    });

    it('should generate correct keys for all course-task-subtask combinations', () => {
      mockConfirm.mockReturnValue(true);
      
      const courses: Course[] = [{ id: 100, code: 'TEST' }];
      const tasks: Tasks = {
        'Test Type': ['Subtask One', 'Subtask Two']
      };
      
      resetTaskStatuses(courses, tasks, mockSetTaskStatus);
      
      const resetStatus = mockSetTaskStatus.mock.calls[0][0];
      
      expect(resetStatus['100-Test Type-Subtask One']).toBe(false);
      expect(resetStatus['100-Test Type-Subtask Two']).toBe(false);
      expect(Object.keys(resetStatus)).toHaveLength(2);
    });

    it('should work with multiple task types and courses', () => {
      mockConfirm.mockReturnValue(true);
      
      const largeCourses: Course[] = [
        { id: 1, code: 'A' },
        { id: 2, code: 'B' },
        { id: 3, code: 'C' }
      ];
      
      const largeTasks: Tasks = {
        'Type 1': ['T1', 'T2'],
        'Type 2': ['T3'],
        'Type 3': ['T4', 'T5', 'T6']
      };
      
      resetTaskStatuses(largeCourses, largeTasks, mockSetTaskStatus);
      
      const resetStatus = mockSetTaskStatus.mock.calls[0][0];
      
      // Should have 3 courses × (2 + 1 + 3) tasks = 18 total entries
      expect(Object.keys(resetStatus)).toHaveLength(18);
      
      // Verify all values are false
      Object.values(resetStatus).forEach(value => {
        expect(value).toBe(false);
      });
    });
  });
});
