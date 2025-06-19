import { progressCalculations } from '../utils/progressCalculations';
import { Course, TaskStatus, Tasks } from '../types/course';

describe('progressCalculations', () => {
  const mockCourses: Course[] = [
    { id: 1, code: 'CS101' },
    { id: 2, code: 'CS102' }
  ];

  const mockTasks: Tasks = {
    'Course Directive': ['Task 1', 'Task 2'],
    'Moodle': ['Task A', 'Task B', 'Task C']
  };

  describe('calculateTaskProgress', () => {
    it('should return 0 when no courses exist', () => {
      const result = progressCalculations.calculateTaskProgress(
        'Course Directive',
        [],
        mockTasks,
        {}
      );
      expect(result).toBe(0);
    });

    it('should return 0 when no tasks are completed', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': false,
        '1-Course Directive-Task 2': false,
        '2-Course Directive-Task 1': false,
        '2-Course Directive-Task 2': false
      };

      const result = progressCalculations.calculateTaskProgress(
        'Course Directive',
        mockCourses,
        mockTasks,
        taskStatus
      );
      expect(result).toBe(0);
    });

    it('should return 100 when all tasks are completed', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': true,
        '1-Course Directive-Task 2': true,
        '2-Course Directive-Task 1': true,
        '2-Course Directive-Task 2': true
      };

      const result = progressCalculations.calculateTaskProgress(
        'Course Directive',
        mockCourses,
        mockTasks,
        taskStatus
      );
      expect(result).toBe(100);
    });

    it('should return 50 when half the tasks are completed', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': true,
        '1-Course Directive-Task 2': true,
        '2-Course Directive-Task 1': false,
        '2-Course Directive-Task 2': false
      };

      const result = progressCalculations.calculateTaskProgress(
        'Course Directive',
        mockCourses,
        mockTasks,
        taskStatus
      );
      expect(result).toBe(50);
    });

    it('should exclude N/A tasks from calculation', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': true,
        '1-Course Directive-Task 2': 'na',
        '2-Course Directive-Task 1': true,
        '2-Course Directive-Task 2': 'na'
      };

      const result = progressCalculations.calculateTaskProgress(
        'Course Directive',
        mockCourses,
        mockTasks,
        taskStatus
      );
      expect(result).toBe(100); // 2 completed out of 2 applicable tasks
    });

    it('should handle mixed completion states correctly', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': true,
        '1-Course Directive-Task 2': false,
        '2-Course Directive-Task 1': 'na',
        '2-Course Directive-Task 2': true
      };

      const result = progressCalculations.calculateTaskProgress(
        'Course Directive',
        mockCourses,
        mockTasks,
        taskStatus
      );
      expect(result).toBe(67); // 2 completed out of 3 applicable tasks (rounded)
    });
  });

  describe('calculateCourseTaskProgress', () => {
    it('should return 0 when no tasks are completed for the course', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': false,
        '1-Course Directive-Task 2': false
      };

      const result = progressCalculations.calculateCourseTaskProgress(
        1,
        'Course Directive',
        mockTasks,
        taskStatus
      );
      expect(result).toBe(0);
    });

    it('should return 100 when all tasks are completed for the course', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': true,
        '1-Course Directive-Task 2': true
      };

      const result = progressCalculations.calculateCourseTaskProgress(
        1,
        'Course Directive',
        mockTasks,
        taskStatus
      );
      expect(result).toBe(100);
    });

    it('should exclude N/A tasks from calculation for specific course', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': true,
        '1-Course Directive-Task 2': 'na'
      };

      const result = progressCalculations.calculateCourseTaskProgress(
        1,
        'Course Directive',
        mockTasks,
        taskStatus
      );
      expect(result).toBe(100); // 1 completed out of 1 applicable task
    });

    it('should return 0 when all tasks are N/A', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': 'na',
        '1-Course Directive-Task 2': 'na'
      };

      const result = progressCalculations.calculateCourseTaskProgress(
        1,
        'Course Directive',
        mockTasks,
        taskStatus
      );
      expect(result).toBe(0);
    });
  });

  describe('calculateCourseProgress', () => {
    it('should return 0 when no tasks are completed for the course', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': false,
        '1-Course Directive-Task 2': false,
        '1-Moodle-Task A': false,
        '1-Moodle-Task B': false,
        '1-Moodle-Task C': false
      };

      const result = progressCalculations.calculateCourseProgress(1, mockTasks, taskStatus);
      expect(result).toBe(0);
    });

    it('should return 100 when all tasks are completed for the course', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': true,
        '1-Course Directive-Task 2': true,
        '1-Moodle-Task A': true,
        '1-Moodle-Task B': true,
        '1-Moodle-Task C': true
      };

      const result = progressCalculations.calculateCourseProgress(1, mockTasks, taskStatus);
      expect(result).toBe(100);
    });

    it('should calculate progress across multiple task types', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': true,
        '1-Course Directive-Task 2': true,
        '1-Moodle-Task A': false,
        '1-Moodle-Task B': false,
        '1-Moodle-Task C': false
      };

      const result = progressCalculations.calculateCourseProgress(1, mockTasks, taskStatus);
      expect(result).toBe(40); // 2 completed out of 5 total tasks
    });

    it('should exclude N/A tasks from overall course calculation', () => {
      const taskStatus: TaskStatus = {
        '1-Course Directive-Task 1': true,
        '1-Course Directive-Task 2': 'na',
        '1-Moodle-Task A': true,
        '1-Moodle-Task B': 'na',
        '1-Moodle-Task C': 'na'
      };

      const result = progressCalculations.calculateCourseProgress(1, mockTasks, taskStatus);
      expect(result).toBe(100); // 2 completed out of 2 applicable tasks
    });
  });
});
