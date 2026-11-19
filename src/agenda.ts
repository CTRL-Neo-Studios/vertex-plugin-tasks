import type {CalendarDate} from '@internationalized/date'
import {type Fields, isOpen, isOverdue, type Task} from '@type32/tasks'
import {dayOf} from '@type32/tasks-ui-components'

/** A row of the agenda: plain JSON, so a plugin window can be sent it. */
export interface AgendaRow {
    key: string
    title: string
    /** The time it's listed by: its Due, else its Do (the task's own wall clock). */
    when: string
    note: boolean
    /** Its file's name, without the extension. */
    source: string
}

export interface AgendaGroup {
    id: 'overdue' | 'today' | 'upcoming'
    rows: AgendaRow[]
}

/**
 * The open tasks with a date: Overdue (due and past), Today (Do or Due by today) and Upcoming, each by day, then by
 * title; empty groups left out. `zone` is the viewer's.
 */
export function agenda(entries: readonly { key: string, task: Task, fields: Fields, path: string, note: boolean }[], today: CalendarDate, zone: string): AgendaGroup[] {
    const groups: Record<AgendaGroup['id'], { row: AgendaRow, day: CalendarDate }[]> = {overdue: [], today: [], upcoming: []}
    for (const {key, task, fields, path, note} of entries) {
        if (!isOpen(task, fields)) continue
        const times = [task.start, task.due].filter(v => v !== undefined)
        if (times.length === 0) continue
        const day = times.map(v => dayOf(v, task.timeZone, zone)).reduce((a, b) => (b.compare(a) < 0 ? b : a))
        const source = path.slice(path.lastIndexOf('/') + 1).replace(/\.(md|task)$/i, '')
        const row = {key, title: task.title, when: task.due ?? task.start!, note, source}
        const id = isOverdue(task, fields, {timeZone: zone}) ? 'overdue' : day.compare(today) <= 0 ? 'today' : 'upcoming'
        groups[id].push({row, day})
    }
    return (['overdue', 'today', 'upcoming'] as const)
        .map(id => ({id, rows: groups[id].sort((a, b) => a.day.compare(b.day) || a.row.title.localeCompare(b.row.title)).map(r => r.row)}))
        .filter(g => g.rows.length)
}
