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

describe('useSemesterPersistence - Data Separation', () => {
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

  it('should maintain separate data for start and end semesters', () => {
    const { result } = renderHook(() => 
      useSemesterPersistence(defaultStartTasks, defaultEndTasks)
    );

    // Initially on start semester
    expect(result.current.activeSemester).toBe('start');
    expect(result.current.tasks).toEqual(defaultStartTasks);

    // Add course to start semester
    act(() => {
      result.current.setCourses([{ id: 1, code: 'CS101' }]);
    });

    // Switch to end semester
    act(() => {
      result.current.setActiveSemester('end');
    });

    // Should be on end semester with different tasks and no courses
    expect(result.current.activeSemester).toBe('end');
    expect(result.current.tasks).toEqual(defaultEndTasks);
    expect(result.current.courses).toEqual([]);

    // Add course to end semester
    act(() => {
      result.current.setCourses([{ id: 2, code: 'CS401' }]);
    });

    // Switch back to start semester
    act(() => {
      result.current.setActiveSemester('start');
    });

    // Should have start semester data intact
    expect(result.current.activeSemester).toBe('start');
    expect(result.current.tasks).toEqual(defaultStartTasks);
    expect(result.current.courses).toEqual([{ id: 1, code: 'CS101' }]);

    // Switch back to end semester to verify its data is intact
    act(() => {
      result.current.setActiveSemester('end');
    });

    expect(result.current.courses).toEqual([{ id: 2, code: 'CS401' }]);
    expect(result.current.tasks).toEqual(defaultEndTasks);
  });

  it('should persist data independently for both semesters', async () => {
    const { result } = renderHook(() => 
      useSemesterPersistence(defaultStartTasks, defaultEndTasks)
    );

    // Wait for initialization to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Add data to start semester
    act(() => {
      result.current.setCourses([{ id: 1, code: 'START101' }]);
      result.current.setTaskStatus({ '1-Course Directive-Task 1': true });
    });

    // Wait for state update and localStorage save
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Switch to end semester and add data
    act(() => {
      result.current.setActiveSemester('end');
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setCourses([{ id: 2, code: 'END401' }]);
      result.current.setTaskStatus({ '2-Final Grades-Grade 1': true });
    });

    // Wait for state update and localStorage save
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify localStorage has separate entries
    const startData = JSON.parse(localStorageMock.getItem('courseMatrix_startSemester') || '{}');
    const endData = JSON.parse(localStorageMock.getItem('courseMatrix_endSemester') || '{}');

    expect(startData.courses).toEqual([{ id: 1, code: 'START101' }]);
    expect(startData.taskStatus).toEqual({ '1-Course Directive-Task 1': true });

    expect(endData.courses).toEqual([{ id: 2, code: 'END401' }]);
    expect(endData.taskStatus).toEqual({ '2-Final Grades-Grade 1': true });
  });

  it('should load persisted data correctly on initialization', () => {
    // Pre-populate localStorage
    localStorageMock.setItem('courseMatrix_activeSemester', 'end');
    localStorageMock.setItem('courseMatrix_startSemester', JSON.stringify({
      courses: [{ id: 1, code: 'SAVED_START' }],
      tasks: defaultStartTasks,
      taskStatus: { 'saved-start-task': true }
    }));
    localStorageMock.setItem('courseMatrix_endSemester', JSON.stringify({
      courses: [{ id: 2, code: 'SAVED_END' }],
      tasks: defaultEndTasks,
      taskStatus: { 'saved-end-task': true }
    }));

    const { result } = renderHook(() => 
      useSemesterPersistence(defaultStartTasks, defaultEndTasks)
    );

    // Should load end semester as active
    expect(result.current.activeSemester).toBe('end');
    expect(result.current.courses).toEqual([{ id: 2, code: 'SAVED_END' }]);
    expect(result.current.taskStatus).toEqual({ 'saved-end-task': true });

    // Switch to start semester and verify it loaded correctly
    act(() => {
      result.current.setActiveSemester('start');
    });

    expect(result.current.courses).toEqual([{ id: 1, code: 'SAVED_START' }]);
    expect(result.current.taskStatus).toEqual({ 'saved-start-task': true });
  });

  it('should copy courses from current semester to the other semester', () => {
    const { result } = renderHook(() => 
      useSemesterPersistence(defaultStartTasks, defaultEndTasks)
    );

    // Initially on start semester, add some courses
    act(() => {
      result.current.setCourses([
        { id: 1, code: 'CS101' },
        { id: 2, code: 'MATH201' }
      ]);
    });

    // Verify courses are in start semester
    expect(result.current.courses).toEqual([
      { id: 1, code: 'CS101' },
      { id: 2, code: 'MATH201' }
    ]);
    expect(result.current.otherSemesterCourses).toEqual([]);

    // Copy courses to end semester
    act(() => {
      result.current.copyCourses();
    });

    // Switch to end semester and verify courses were copied
    act(() => {
      result.current.setActiveSemester('end');
    });

    expect(result.current.courses).toEqual([
      { id: 1, code: 'CS101' },
      { id: 2, code: 'MATH201' }
    ]);

    // Add a course to end semester
    act(() => {
      result.current.setCourses([
        ...result.current.courses,
        { id: 3, code: 'PHY301' }
      ]);
    });

    // Copy from end back to start
    act(() => {
      result.current.copyCourses();
    });

    // Switch to start and verify it now has all courses
    act(() => {
      result.current.setActiveSemester('start');
    });

    expect(result.current.courses).toEqual([
      { id: 1, code: 'CS101' },
      { id: 2, code: 'MATH201' },
      { id: 3, code: 'PHY301' }
    ]);
  });
});
