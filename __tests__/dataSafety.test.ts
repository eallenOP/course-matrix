import { renderHook, act, waitFor } from '@testing-library/react';
import { useSemesterPersistence } from '../hooks/useSemesterPersistence';
import { Tasks } from '../types/course';

const startKey = 'courseMatrix_startSemester';
const endKey = 'courseMatrix_endSemester';
const defaults: Tasks = { Moodle: ['Task A'] };

const load = async () => {
  const hook = renderHook(() => useSemesterPersistence(defaults, defaults));
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  return hook;
};
const backups = () => Object.keys(localStorage).filter(key => key.startsWith(`${startKey}_backup_`));

describe('unreadable saved data', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['broken JSON', '{broken'],
    ['wrong shape', '{"courses":"x","tasks":{"Mine":["a"]},"taskStatus":{}}'],
    ['partly invalid tasks', '{"courses":[],"tasks":{"Mine":["a"],"Bad":"x"},"taskStatus":{}}'],
  ])('keeps a copy of the original and warns: %s', async (_name, raw) => {
    const end = { courses: [{ id: 2, code: 'END' }], tasks: defaults, taskStatus: {} };
    localStorage.setItem(startKey, raw);
    localStorage.setItem(endKey, JSON.stringify(end));
    const { result } = await load();

    expect(Object.values({ ...localStorage })).toContain(raw);
    expect(backups()).toHaveLength(1);
    expect(result.current.loadWarning).toContain(backups()[0]);
    expect(JSON.parse(localStorage.getItem(endKey)!)).toEqual(end);
  });

  it('does not overwrite the original when it cannot be backed up', async () => {
    localStorage.setItem(startKey, '{broken');
    const setItem = Storage.prototype.setItem;
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key.includes('_backup_')) throw new Error('quota');
      setItem.call(this, key, value);
    });
    const { result } = await load();
    act(() => result.current.setCourses([{ id: 1, code: 'NEW' }]));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(localStorage.getItem(startKey)).toBe('{broken');
    expect(result.current.loadWarning).toContain('will not be saved');
  });

  it('makes no backup for ordinary data with leftover statuses', async () => {
    localStorage.setItem(startKey, JSON.stringify({
      courses: [{ id: 1, code: 'A' }], tasks: defaults, taskStatus: { '1-Moodle-Old name': true },
    }));
    const { result } = await load();
    expect(backups()).toEqual([]);
    expect(result.current.loadWarning).toBeNull();
  });
});
