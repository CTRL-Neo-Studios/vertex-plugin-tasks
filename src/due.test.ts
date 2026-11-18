import {expect, test} from 'bun:test'
import {resolveFields, type Task} from '@type32/tasks'
import {dueNow} from './due'

const fields = resolveFields({})
const at = '2026-11-18T10:00:00Z'
const entry = (id: string, extra: Partial<Task>) => ({task: {id, title: id, updatedAt: at, ...extra} as Task, fields})
const zone = 'America/New_York'
// 2026-11-18 is in EST (UTC-5).
const ny = (time: string) => new Date(`2026-11-18T${time}:00-05:00`)
const keys = (now: Date, sent: string[] = [], entries = all) => dueNow(entries, now, new Set(sent), zone).map(d => d.key)

const all = [
    entry('call', {due: '2026-11-18T10:00'}),
    entry('berlin', {due: '2026-11-18T16:00', timeZone: 'Europe/Berlin'}),
    entry('daily', {due: '2026-11-15T10:00', recurrence: {freq: 'daily'}}),
    entry('date', {due: '2026-11-18'}),
    entry('done', {due: '2026-11-18T10:00', values: {status: 'done'}}),
]

test('a due time alerts once it has come, for ten minutes, in its own zone; dates and closed tasks never', () => {
    expect(keys(ny('09:59'))).toEqual([])
    expect(keys(ny('10:05'))).toEqual(['call@2026-11-18T10:00', 'berlin@2026-11-18T16:00', 'daily@2026-11-18T10:00'])
    expect(keys(ny('10:11'))).toEqual([])
})

test('what was sent is not sent again', () => {
    expect(keys(ny('10:05'), ['call@2026-11-18T10:00', 'daily@2026-11-18T10:00'])).toEqual(['berlin@2026-11-18T16:00'])
})
