import {parseDateTime, today, toZoned} from '@internationalized/date'
import {type Fields, isOpen, occurrences, type Task} from '@type32/tasks'

/** How late an alert may still come: a window opened 10 minutes after a due time still says so, not a day after. */
export const LATE_MS = 10 * 60_000

export interface Due<T> {
    /** What it's remembered by once sent: the task and that time of it. */
    key: string
    entry: T
    /** The due time, in the task's own wall clock. */
    due: string
}

/**
 * The open tasks whose due time has come (in the last `LATE_MS`) and that haven't been alerted (`sent`). A due with a
 * time only (a date has no moment to alert at); for a repeating task, each occurrence's, the one around now. Times are
 * the task's `timeZone`'s, a floating one the viewer's (`zone`).
 */
export function dueNow<T extends { task: Task, fields: Fields }>(entries: readonly T[], now: Date, sent: ReadonlySet<string>, zone: string): Due<T>[] {
    const day = today(zone)
    const window = {from: day.subtract({days: 1}).toString(), to: day.add({days: 2}).toString(), timeZone: zone}
    const out: Due<T>[] = []
    for (const entry of entries) {
        const {task} = entry
        if (!task.due?.includes('T') || !isOpen(task, entry.fields)) continue
        const dues = task.recurrence ? occurrences(task, window).map(o => o.due).filter(d => d !== undefined) : [task.due]
        for (const due of dues) {
            const at = toZoned(parseDateTime(due), task.timeZone ?? zone).toDate().getTime()
            const key = `${task.id}@${due}`
            if (at <= now.getTime() && now.getTime() - at < LATE_MS && !sent.has(key)) out.push({key, entry, due})
        }
    }
    return out
}
