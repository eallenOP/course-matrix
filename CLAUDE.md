# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                                    # dev server (Turbopack) at http://localhost:3000
npm run build                                  # production build; also type checks app code
npm test                                       # all Jest tests
npm run test:watch
npx jest __tests__/TaskEditor.test.tsx         # one test file
npx jest -t "part of test name"                # tests matching a name
npm run type-check                             # tsc, including tests
npm run test:ci                                # tests with coverage, as a single run
```

There is no lint script or ESLint config. `npm run build` ignores type errors in `__tests__/`, and Jest (SWC) does not type check, so only `tsc` catches them. GitHub Actions runs `tsc`, the build and the tests on Node 18 and 20.

## Architecture

A client-only, single-page Next.js 15 (App Router) / React 19 app for tracking course preparation tasks. There is no backend, API or auth; all data lives in the browser's localStorage.

`components/CourseMatrix.tsx` is the container. It defines the default tasks for each semester, owns UI state (except small local state inside `TaskEditor` and `TopControls`), and passes data and callbacks to the other components. Data flows:

`useSemesterPersistence` → `CourseMatrix` → `SemesterTabs`, `TopControls`, `TaskEditor`, `MatrixTable`

`SaveIndicator` and `ErrorAlert` show storage state. `contexts/ThemeContext.tsx` provides light/dark themes; dark styles, including overrides for hard-coded greys and destructive buttons, are in `app/globals.css`. Tests that render `CourseMatrix` need `ThemeProvider`.

### Semesters

"Semester" means one of two independent matrices, `'start'` and `'end'` (start-of-semester and end-of-semester work). Each has its own courses, tasks and statuses. `hooks/useSemesterPersistence.ts` holds both and exposes the active one through `courses`/`tasks`/`taskStatus` and matching setters. Only `setTaskStatus` accepts an updater function; `setCourses` and `setTasks` take plain values.

localStorage keys: `courseMatrix_activeSemester`, `courseMatrix_startSemester`, `courseMatrix_endSemester`. Reads and writes go through `utils/storage.ts`; loaded data is checked and repaired by `utils/dataValidation.ts`, which drops empty task types and orphaned statuses, and duplicate course codes and subtasks ignoring case. Loading happens in a mount-only effect and saving is gated on `isInitialized`. If loading would lose anything other than orphaned statuses, the original is copied to `<key>_backup_<timestamp>`; if that fails, saving that semester is blocked. This is reported through `loadWarning`, not `storageError`, because any successful save clears `storageError`. The empty dependency array is deliberate: the default task objects are recreated on every render, and depending on them caused an infinite loop.

Saved tasks take precedence over defaults, so changing the defaults in `CourseMatrix` does not affect existing users until they use "Reset to Default".

`copyCourses` appends the active semester's courses to the other one with new IDs, skipping codes already there. It does not copy tasks or statuses.

### Task status keys

`taskStatus` is a flat map keyed by `` `${courseId}-${taskType}-${subtask}` ``. This format is built inline in `CourseMatrix`, `MatrixTable` and `utils/progressCalculations.ts`; change all of them together. Consequences:

- Tasks and subtasks have no IDs; their names are their identity. Renaming one orphans its statuses, and duplicate subtask names in a task type share one status.
- Removing a course, task type or subtask leaves its old status entries behind until the next load, when validation removes them.

Values cycle `undefined`/`false` → `true` → `'na'` → `false`. `'na'` is excluded from progress totals; all-N/A counts as 100% (done), an empty list as 0%, and unfinished work is capped at 99%. Progress is derived on render, never stored.

## Conventions

- `@/*` maps to the repo root (in both `tsconfig.json` and `jest.config.js`).
- `components/ui/` contains shadcn/ui components (new-york style, zinc, Tailwind v3).
- `wide:` is a custom 880px Tailwind breakpoint used by `TopControls`.
- Jest maps `lucide-react` to `__mocks__/lucide-react.js`, which exports only a few icons. A newly used icon is `undefined` in tests until it is added there or to the test file's own `jest.mock('lucide-react', ...)`.
