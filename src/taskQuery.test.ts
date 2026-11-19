import {expect, test} from 'bun:test'
import {resolveFields, type Task} from '@type32/tasks'
import {addedFields, findEntry, listTasks, updatePatch} from './taskQuery'
import type {WorkspaceTask} from './workspace'

const fields = resolveFields({})
const entry = (path: string, task: Pick<Task, 'id' | 'title'> & Partial<Task>): WorkspaceTask =>
    ({key: `${path}:${task.id}`, task: {updatedAt: '2026-01-01T00:00:00Z', ...task}, fields, uuid: path, path, note: path.endsWith('.md')})
const entries = [
    entry('Work/Plan.task', {id: 'a', title: 'Draft the brief', due: '2026-05-14'}),
    entry('Work/Plan.task', {id: 'b', title: 'Call Ann', start: '2026-05-12T09:00', notes: 'About the venue'}),
    entry('Work/Plan.task', {id: 'c', title: 'Ship it', due: '2026-05-20', values: {status: 'done'}}),
    entry('Home.task', {id: 'd', title: 'Water plants'}),
    entry('Notes/Taxes.md', {id: 'e', title: 'Taxes', due: '2026-05-10'}),
]
const now = new Date('2026-05-11T12:00:00Z')
const titles = (out: { tasks: { title: string }[] }) => out.tasks.map(t => t.title)

test('lists the open tasks by the day of their Due, else their Do, undated last', () => {
    const all = listTasks(entries, {}, 'UTC', now)
    expect(titles(all)).toEqual(['Taxes', 'Call Ann', 'Draft the brief', 'Water plants'])
    expect(all.tasks[0]).toEqual({file: 'Notes/Taxes.md', id: 'e', title: 'Taxes', status: 'todo', due: '2026-05-10', overdue: true})
    expect(titles(listTasks(entries, {closed: true}, 'UTC', now))).toContain('Ship it')
})

test('a day range leaves out undated tasks; text matches notes; a file by its path or name', () => {
    expect(titles(listTasks(entries, {from: '2026-05-11', to: '2026-05-17'}, 'UTC', now))).toEqual(['Call Ann', 'Draft the brief'])
    expect(titles(listTasks(entries, {query: 'venue'}, 'UTC', now))).toEqual(['Call Ann'])
    expect(titles(listTasks(entries, {file: 'Home'}, 'UTC', now))).toEqual(['Water plants'])
    expect(titles(listTasks(entries, {file: '/Work/Plan.task'}, 'UTC', now))).toEqual(['Call Ann', 'Draft the brief'])
})

test('an update completes only what is open, reopens only what is done, and moves or clears dates', () => {
    const [brief, call, shipped] = entries as [WorkspaceTask, WorkspaceTask, WorkspaceTask]
    const at = '2026-05-11T12:00:00Z'
    expect(updatePatch(brief, {file: '', id: 'a', done: true}, at)).toMatchObject({completedAt: at})
    expect(updatePatch(shipped, {file: '', id: 'c', done: true}, at)).toEqual({})
    expect(updatePatch(shipped, {file: '', id: 'c', done: false}, at)).not.toEqual({})
    expect(updatePatch(call, {file: '', id: 'b', do: '2026-05-13'}, at)).toMatchObject({start: '2026-05-13T09:00'})
    expect(updatePatch(call, {file: '', id: 'b', do: '2026-05-13T15:30'}, at)).toMatchObject({start: '2026-05-13T15:30'})
    expect(updatePatch(brief, {file: '', id: 'a', due: null, title: ' Brief '}, at)).toEqual({due: undefined, title: 'Brief'})
})

test('a task is found by its id in a file named by path or name, and an added task needs a title', () => {
    expect(findEntry(entries, {file: 'Plan', id: 'b'})?.task.title).toBe('Call Ann')
    expect(findEntry(entries, {file: 'Notes/Taxes.md', id: 'e'})?.note).toBe(true)
    expect(findEntry(entries, {file: 'Home.task', id: 'b'})).toBeUndefined()
    expect(addedFields({title: ' Call Ann ', do: '2026-05-12T09:00'})).toEqual({title: 'Call Ann', start: '2026-05-12T09:00', due: undefined, notes: undefined})
    expect(() => addedFields({title: '  '})).toThrow(/title/)
})
