import {isOpen, isOverdue, statusOf} from '@type32/tasks'
import {dayOf, type TaskPatch, toggleDone, withDue, withStart} from '@type32/tasks-ui-components'
import type {WorkspaceTask} from './workspace'

const LIMIT = 100
const NOTES_CHARS = 300

export interface ListInput {
    query?: string
    from?: string
    to?: string
    file?: string
    closed?: boolean
}

export interface UpdateInput {
    file: string
    id: string
    done?: boolean
    title?: string
    do?: string | null
    due?: string | null
}

export interface AddInput {
    title?: string
    do?: string
    due?: string
    notes?: string
}

/** Whether `file` (a workspace-relative path, or a file's name with or without its extension) names the entry's file. */
export function inFile(entry: WorkspaceTask, file: string) {
    const asked = file.trim().replace(/\\/g, '/').replace(/^\/+/, '')
    const name = entry.path.slice(entry.path.lastIndexOf('/') + 1)
    return entry.path === asked || name === asked || name.replace(/\.(md|task)$/i, '') === asked
}

/** The task `id` in `file` (its path or name), as `tasks_list` gives them; for `tasks_update` and `tasks_delete`. */
export const findEntry = (entries: readonly WorkspaceTask[], input: { file: string, id: string }) =>
    entries.find(e => e.task.id === input.id && inFile(e, input.file))

/** `tasks_add`'s task: its title (trimmed; throws when there's none), Do, Due and notes. */
export function addedFields(input: AddInput) {
    const title = input.title?.trim()
    if (!title) throw new Error('A task needs a title.')
    return {title, start: input.do, due: input.due, notes: input.notes}
}

/**
 * `tasks_list`: the open tasks (every one with `closed`) whose title or notes have `query`, in `file`, and whose Due
 * (else Do) falls on a day from `from` to `to` (the viewer's days); by that day, undated last, then by title.
 */
export function listTasks(entries: readonly WorkspaceTask[], input: ListInput, zone: string, now: Date) {
    const words = input.query?.trim().toLowerCase()
    const found = entries.flatMap((entry) => {
        const {task, fields} = entry
        if (!input.closed && !isOpen(task, fields)) return []
        if (words && !`${task.title}\n${task.notes ?? ''}`.toLowerCase().includes(words)) return []
        if (input.file && !inFile(entry, input.file)) return []
        const when = task.due ?? task.start
        const day = when === undefined ? undefined : dayOf(when, task.timeZone, zone).toString()
        if ((input.from || input.to) && (!day || (input.from && day < input.from) || (input.to && day > input.to))) return []
        return [{day, entry}]
    })
    const byDay = (a?: string, b?: string) => (a === b ? 0 : a === undefined ? 1 : b === undefined ? -1 : a < b ? -1 : 1)
    found.sort((a, b) => byDay(a.day, b.day) || a.entry.task.title.localeCompare(b.entry.task.title))
    const tasks = found.slice(0, LIMIT).map(({entry: {task, fields, path}}) => ({
        file: path,
        id: task.id,
        title: task.title,
        status: statusOf(task, fields),
        ...(task.start !== undefined && {do: task.start}),
        ...(task.due !== undefined && {due: task.due}),
        ...(isOverdue(task, fields, {now, timeZone: zone}) && {overdue: true}),
        ...(task.recurrence && {repeats: true}),
        ...(task.notes && {notes: task.notes.slice(0, NOTES_CHARS)}),
    }))
    return {tasks, more: Math.max(0, found.length - LIMIT)}
}

/**
 * `tasks_update`'s change to `entry`: a title; Do moved to a day (its time and length kept, or the time given) or
 * cleared; Due set or cleared; completed (a repeating task moves to its next time) or reopened.
 */
export function updatePatch(entry: WorkspaceTask, input: UpdateInput, now: string): TaskPatch {
    const {task, fields} = entry
    let patch: TaskPatch = {}
    if (input.title !== undefined) patch.title = input.title.trim()
    if (input.do !== undefined) {
        patch = {...patch, ...withStart(task, input.do?.slice(0, 10)), ...(input.do?.includes('T') && {start: input.do})}
    }
    if (input.due !== undefined) patch = {...patch, ...withDue(task, input.due ?? undefined)}
    if (input.done !== undefined && input.done === isOpen(task, fields)) patch = {...patch, ...toggleDone(task, fields, now)}
    return patch
}
