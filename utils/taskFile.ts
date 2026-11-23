import { Tasks } from '../types/course';
import { validateTasks } from './dataValidation';

/**
 * Parse the contents of a file saved with "Download Tasks". Throws if it is not
 * a task list. Names are cleaned up with the same rules used when loading saved data.
 */
export function parseTaskFile(raw: string): Tasks {
  const data: unknown = JSON.parse(raw);
  const isTaskList = typeof data === 'object' && data !== null && !Array.isArray(data) &&
    Object.values(data).every(subtasks =>
      Array.isArray(subtasks) && subtasks.every(subtask => typeof subtask === 'string')
    );
  if (!isTaskList) throw new Error('Not a task list');

  const tasks = validateTasks(data).fixedData as Tasks;
  if (Object.keys(tasks).length === 0) throw new Error('Task list is empty');
  return tasks;
}
