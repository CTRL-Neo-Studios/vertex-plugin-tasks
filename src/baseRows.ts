import {type Task, validate} from '@type32/tasks'

/** Which of a base's properties hold a row's times: property ids (`note.start`, bare `start`, `file.ctime`, `formula.x`). */
export interface BaseKeys {
    start: string
    end: string
    due: string
}
export type TimeKey = keyof BaseKeys
export const TIME_KEYS: TimeKey[] = ['start', 'end', 'due']

const pad = (n: number) => String(n).padStart(2, '0')
const wall = (d: Date, time: boolean) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}${time ? `T${pad(d.getHours())}:${pad(d.getMinutes())}` : ''}`

/**
 * A property's value as a task's time: a date (`2026-11-20`), or a date and a time of day (`2026-11-20T09:30`, seconds
 * kept), as Obsidian's date and date-time properties write them. One with an offset or `Z` is moved to this computer's
 * wall clock. Anything else isn't a time.
 */
export function toLocalTime(raw: unknown): string | undefined {
    if (typeof raw !== 'string') return undefined
    const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(raw.trim())
    if (!m) return undefined
    const [, date, time, zone] = m
    if (!time) return date
    if (!zone) return `${date}T${time}`
    const at = new Date(`${date}T${time}${zone}`)
    return Number.isNaN(at.getTime()) ? undefined : wall(at, true)
}

/** A base's date value (a file's dates, a formula's): its time on this computer's wall clock. */
export const fromMs = (ms: number, time: boolean) => wall(new Date(ms), time)

/** `note.x` → `x`; a note property is the only kind a layout writes. */
export const noteKey = (id: string) => (id.startsWith('file.') || id.startsWith('formula.') ? undefined : id.replace(/^note\./, ''))

const EPOCH = '1970-01-01T00:00:00Z'

/**
 * A row as a task the views draw: titled by its file, `id` its path, with the times that read. An end without a start,
 * or one the format won't take with that start (another form, before it), is left out; a row with no time at all
 * isn't a task.
 */
export function rowTask(path: string, title: string, times: Partial<Record<TimeKey, string>>): Task | undefined {
    const {start, end, due} = times
    const base: Task = {id: path, title, updatedAt: EPOCH, ...(start && {start}), ...(due && {due})}
    for (const task of start && end ? [{...base, end}, base] : [base]) {
        if (task.start === undefined && task.due === undefined) return undefined
        try {
            validate({version: '1.1', tasks: [task]})
            return task
        } catch {
            // without the end, then nothing
        }
    }
    return undefined
}

/**
 * What a change to a row's task writes to its note: each time it changed, under its property, `null` for one removed.
 * Times in properties the layout can't write (a file's, a formula's) are left out.
 */
export function propertyWrites(patch: Partial<Record<string, unknown>>, keys: BaseKeys): { key: string, value: string | null }[] {
    const out: { key: string, value: string | null }[] = []
    for (const time of TIME_KEYS) {
        if (!(time in patch)) continue
        const key = noteKey(keys[time])
        const value = patch[time]
        if (key !== undefined) out.push({key, value: typeof value === 'string' ? value : null})
    }
    return out
}
