import { renderHook, act } from '@testing-library/react';
import { useSemesterPersistence } from '../hooks/useSemesterPersistence';
import { Tasks } from '../types/course';

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

describe('useSemesterPersistence - Copy Courses Functionality', () => {
  const defaultStartTasks: Tasks = {
    'Course Directive': ['Task 1', 'Task 2'],
    'Moodle': ['Task A', 'Task B']
  };

  const defaultEndTasks: Tasks = {
    'Final Grades': ['Grade 1', 'Grade 2'],
    'Course Evaluation': ['Eval A', 'Eval B']
  };

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should copy courses from start to end semester', () => {
    const { result } = renderHook(() => 
      useSemesterPersistence(defaultStartTasks, defaultEndTasks)
    );

    // Add courses to start semester
    act(() => {
      result.current.setCourses([
        { id: 1, code: 'CS101' },
        { id: 2, code: 'MATH201' }
      ]);
    });

    // Verify start semester has courses
    expect(result.current.courses).toHaveLength(2);
    expect(result.current.courses[0].code).toBe('CS101');
    expect(result.current.courses[1].code).toBe('MATH201');

    // Copy courses from start to end semester (must be called while on start semester)
    act(() => {
      result.current.copyCourses();
    });

    // Switch to end semester to verify the courses were copied there
    act(() => {
      result.current.setActiveSemester('end');
    });

    // Verify end semester now has the copied courses
    expect(result.current.courses).toHaveLength(2);
    expect(result.current.courses[0].code).toBe('CS101');
    expect(result.current.courses[1].code).toBe('MATH201');
    
    // Verify courses have different IDs (they're copies, not references)
    expect(result.current.courses[0].id).not.toBe(1);
    expect(result.current.courses[1].id).not.toBe(2);
  });

  it('should copy courses from end to start semester', () => {
    const { result } = renderHook(() => 
      useSemesterPersistence(defaultStartTasks, defaultEndTasks)
    );

    // Switch to end semester first
    act(() => {
      result.current.setActiveSemester('end');
    });

    // Add courses to end semester
    act(() => {
      result.current.setCourses([
        { id: 5, code: 'ENG301' },
        { id: 6, code: 'HIST401' }
      ]);
    });

    // Verify end semester has courses
    expect(result.current.courses).toHaveLength(2);

    // Copy courses from end to start semester (must be called while on end semester)
    act(() => {
      result.current.copyCourses();
    });

    // Switch to start semester to verify the courses were copied there
    act(() => {
      result.current.setActiveSemester('start');
    });

    // Verify start semester now has the copied courses
    expect(result.current.courses).toHaveLength(2);
    expect(result.current.courses[0].code).toBe('ENG301');
    expect(result.current.courses[1].code).toBe('HIST401');
  });

  it('should append to existing courses when copying', () => {
    const { result } = renderHook(() => 
      useSemesterPersistence(defaultStartTasks, defaultEndTasks)
    );

    // Add courses to start semester
    act(() => {
      result.current.setCourses([
        { id: 1, code: 'CS101' }
      ]);
    });

    // Switch to end semester and add some courses
    act(() => {
      result.current.setActiveSemester('end');
    });

    act(() => {
      result.current.setCourses([
        { id: 2, code: 'EXISTING_COURSE' }
      ]);
    });

    // Copy courses from end to start semester (we're currently on end semester)
    act(() => {
      result.current.copyCourses();
    });

    // Switch to start semester to verify the append behavior
    act(() => {
      result.current.setActiveSemester('start');
    });

    // Verify both existing and copied courses are present in start semester
    expect(result.current.courses).toHaveLength(2);
    expect(result.current.courses.some(c => c.code === 'CS101')).toBe(true);
    expect(result.current.courses.some(c => c.code === 'EXISTING_COURSE')).toBe(true);
  });

  it('should not duplicate courses that already exist', () => {
    const { result } = renderHook(() => 
      useSemesterPersistence(defaultStartTasks, defaultEndTasks)
    );

    // Add courses to start semester
    act(() => {
      result.current.setCourses([
        { id: 1, code: 'CS101' },
        { id: 2, code: 'MATH201' }
      ]);
    });

    // Switch to end semester and add one overlapping course
    act(() => {
      result.current.setActiveSemester('end');
    });

    act(() => {
      result.current.setCourses([
        { id: 3, code: 'CS101' }  // Same code as in start semester
      ]);
    });

    // Copy courses from end to start semester (we're currently on end semester)
    act(() => {
      result.current.copyCourses();
    });

    // Switch to start semester to verify no duplicates
    act(() => {
      result.current.setActiveSemester('start');
    });

    // Should have CS101 (existing), MATH201 (existing), but not duplicate CS101
    expect(result.current.courses).toHaveLength(2);
    expect(result.current.courses.filter(c => c.code === 'CS101')).toHaveLength(1);
    expect(result.current.courses.some(c => c.code === 'MATH201')).toBe(true);
  });

  it('should handle copying when no courses exist in source semester', () => {
    const { result } = renderHook(() => 
      useSemesterPersistence(defaultStartTasks, defaultEndTasks)
    );

    // Start with no courses in start semester
    expect(result.current.courses).toHaveLength(0);

    // Switch to end semester and add some courses
    act(() => {
      result.current.setActiveSemester('end');
    });

    act(() => {
      result.current.setCourses([
        { id: 1, code: 'EXISTING_COURSE' }
      ]);
    });

    // Switch back to start semester (which has no courses)
    act(() => {
      result.current.setActiveSemester('start');
    });

    // Try to copy from start semester (which has no courses)
    act(() => {
      result.current.copyCourses();
    });

    // Switch to end semester to verify no changes
    act(() => {
      result.current.setActiveSemester('end');
    });

    // Should still have just the original course
    expect(result.current.courses).toHaveLength(1);
    expect(result.current.courses[0].code).toBe('EXISTING_COURSE');
  });

  it('should preserve existing task status when copying courses', () => {
    const { result } = renderHook(() => 
      useSemesterPersistence(defaultStartTasks, defaultEndTasks)
    );

    // Add courses and task status to start semester
    act(() => {
      result.current.setCourses([{ id: 1, code: 'CS101' }]);
      result.current.setTaskStatus({ '1-Course Directive-Task 1': true });
    });

    // Switch to end semester and add some task status
    act(() => {
      result.current.setActiveSemester('end');
    });

    act(() => {
      result.current.setTaskStatus({ '999-Final Grades-Grade 1': true });
    });

    // Copy courses from end to start semester (we're currently on end semester)
    act(() => {
      result.current.copyCourses();
    });

    // Switch to start semester to verify task status is preserved
    act(() => {
      result.current.setActiveSemester('start');
    });

    // Verify existing task status is preserved
    expect(result.current.taskStatus['1-Course Directive-Task 1']).toBe(true);
    
    // Task status from end semester should not be copied
    expect(result.current.taskStatus['999-Final Grades-Grade 1']).toBeUndefined();
  });
});
