export interface Course {
  id: number;
  code: string;
}

export type TaskStatus = { [key: string]: boolean | 'na' | undefined };

export type Tasks = { [key: string]: string[] }; // Each task type maps to an array of subtasks

export type SemesterType = 'start' | 'end';

export interface SemesterData {
  courses: Course[];
  tasks: Tasks;
  taskStatus: TaskStatus;
}
