import {expect, test} from 'bun:test'
import {propertyWrites, rowTask, toLocalTime} from './baseRows'

test("a property's text as a task's time: dates, date-times (seconds kept), nothing else", () => {
    expect(toLocalTime('2026-11-20')).toBe('2026-11-20')
    expect(toLocalTime('2026-11-20T09:30')).toBe('2026-11-20T09:30')
    expect(toLocalTime('2026-11-20 09:30:15')).toBe('2026-11-20T09:30:15')
    expect(toLocalTime('next week')).toBeUndefined()
    expect(toLocalTime(20261120)).toBeUndefined()
    // An instant lands on this computer's wall clock.
    const at = new Date('2026-11-20T09:30:00Z')
    const local = `2026-11-${String(at.getDate()).padStart(2, '0')}T${String(at.getHours()).padStart(2, '0')}:30`
    expect(toLocalTime('2026-11-20T09:30:00Z')).toBe(local)
})

test('a row is a task when one of its times reads; an end the format refuses is dropped', () => {
    expect(rowTask('a.md', 'A', {start: '2026-11-20', end: '2026-11-22'})).toMatchObject({id: 'a.md', start: '2026-11-20', end: '2026-11-22'})
    expect(rowTask('a.md', 'A', {start: '2026-11-20', end: '2026-11-18'})).not.toHaveProperty('end')
    expect(rowTask('a.md', 'A', {start: '2026-11-20T09:00', end: '2026-11-22'})).not.toHaveProperty('end')
    expect(rowTask('a.md', 'A', {end: '2026-11-22'})).toBeUndefined()
    expect(rowTask('a.md', 'A', {due: '2026-11-22'})).toMatchObject({due: '2026-11-22'})
})

test('a drag writes the times it moved to their note properties, never a file or formula property', () => {
    const keys = {start: 'note.when', end: 'until', due: 'file.mtime'}
    expect(propertyWrites({start: '2026-11-21', end: '2026-11-23', due: '2026-11-24'}, keys)).toEqual([
        {key: 'when', value: '2026-11-21'},
        {key: 'until', value: '2026-11-23'},
    ])
    expect(propertyWrites({end: undefined}, keys)).toEqual([{key: 'until', value: null}])
})
