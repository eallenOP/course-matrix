import { Course, TaskStatus, Tasks } from '../types/course';

export const progressCalculations = {
  /**
   * Calculate overall progress for a specific task type across all courses
   * @param taskType - The task type to calculate progress for
   * @param courses - Array of courses
   * @param tasks - Task definitions
   * @param taskStatus - Current status of all tasks
   * @returns Progress percentage (0-100)
   */
  calculateTaskProgress: (
    taskType: string,
    courses: Course[],
    tasks: Tasks,
    taskStatus: TaskStatus
  ): number => {
    let total = 0;
    let completed = 0;

    courses.forEach(course => {
      tasks[taskType].forEach(subtask => {
        const status = taskStatus[`${course.id}-${taskType}-${subtask}`];
        if (status !== 'na') {
          total++;
          if (status === true) {
            completed++;
          }
        }
      });
    });

    return total === 0 ? 0 : Math.round((completed / total) * 100);
  },

  /**
   * Calculate progress for a specific task type in a specific course
   * @param courseId - ID of the course
   * @param taskType - The task type to calculate progress for
   * @param tasks - Task definitions
   * @param taskStatus - Current status of all tasks
   * @returns Progress percentage (0-100)
   */
  calculateCourseTaskProgress: (
    courseId: number,
    taskType: string,
    tasks: Tasks,
    taskStatus: TaskStatus
  ): number => {
    let totalActiveTasks = 0;
    let completedTasks = 0;

    tasks[taskType].forEach(subtask => {
      const status = taskStatus[`${courseId}-${taskType}-${subtask}`];
      if (status !== 'na') {
        totalActiveTasks++;
        if (status === true) {
          completedTasks++;
        }
      }
    });

    return totalActiveTasks === 0 ? 0 : Math.round((completedTasks / totalActiveTasks) * 100);
  },

  /**
   * Calculate overall progress for a specific course across all task types
   * @param courseId - ID of the course
   * @param tasks - Task definitions
   * @param taskStatus - Current status of all tasks
   * @returns Progress percentage (0-100)
   */
  calculateCourseProgress: (
    courseId: number,
    tasks: Tasks,
    taskStatus: TaskStatus
  ): number => {
    let total = 0;
    let completed = 0;

    Object.keys(tasks).forEach(taskType => {
      tasks[taskType].forEach(subtask => {
        const status = taskStatus[`${courseId}-${taskType}-${subtask}`];
        if (status !== 'na') {
          total++;
          if (status === true) {
            completed++;
          }
        }
      });
    });

    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }
};
