import { Course, TaskStatus, Tasks } from '../types/course';

export const resetTaskStatuses = (
  courses: Course[],
  tasks: Tasks,
  setTaskStatus: (status: TaskStatus) => void
): void => {
  const confirmReset = window.confirm("Are you sure you want to reset all tasks to unchecked?");

  if (confirmReset) {
    const resetStatus: TaskStatus = {};

    // Initialize task status for every course, task, and subtask
    courses.forEach(course => {
      Object.keys(tasks).forEach(taskType => {
        tasks[taskType].forEach(subtask => {
          resetStatus[`${course.id}-${taskType}-${subtask}`] = false;
        });
      });
    });

    setTaskStatus(resetStatus);
  }
};
