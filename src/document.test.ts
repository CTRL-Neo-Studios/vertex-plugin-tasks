import {expect, test} from 'bun:test'
import {parse, stringify, validate} from '@type32/tasks'
import {defaultLabels} from '@type32/tasks-ui-components'
import en from '../locales/en.json'
import {read, sniff, withRecord} from './document'

const at = '2026-11-18T10:00:00Z'
const names = {list: 'Inbox', listView: 'List', boardView: 'Board'}

test('the format is sniffed from the text', () => {
    expect(sniff('\uFEFF{"version": "1.1", "tasks": []}')).toBe('json')
    expect(sniff('# a comment\nversion = "1.1"\ntasks = []')).toBe('toml')
    expect(sniff('[[tasks]]\nid = "a"')).toBe('toml')
    expect(sniff('version: "1.1"\ntasks: []')).toBe('yaml')
    expect(sniff('')).toBe('yaml')
})

test('an empty file is a valid new document with one list and a List and a Board', () => {
    const result = read('  \n', names, at)
    if (!('doc' in result)) throw new Error('not read')
    expect(result.created).toBe(true)
    expect(() => validate(result.doc)).not.toThrow()
    expect(result.doc.lists!.map(l => l.title)).toEqual(['Inbox'])
    expect(result.doc.views!.map(v => [v.type, v.groupBy])).toEqual([['list', undefined], ['board', 'values.status']])
})

test.each(['json', 'toml'] as const)('a %s file is written back as %s, an unknown key kept', (format) => {
    const text = stringify({version: '1.1', 'x-app': {theme: 'dark'}, tasks: [{id: 'a', title: 'A', updatedAt: at}]}, format)
    const result = read(text, names, at)
    if (!('doc' in result)) throw new Error('not read')
    expect(result.format).toBe(format)
    const next = withRecord(result.doc, 'tasks', 'a', {title: 'B'}, at)
    const written = parse(stringify(next, result.format), format)
    expect(written['x-app']).toEqual({theme: 'dark'})
    expect(written.tasks[0]!.title).toBe('B')
})

test('a broken file gives its issues by path', () => {
    const result = read('version: "1.1"\ntasks:\n  - {id: a, updatedAt: 2026-11-18T10:00:00Z}\n', names, at)
    expect('issues' in result && result.issues.map(i => i.path)).toEqual([['tasks', 0, 'title']])
})

test('withRecord changes a record, stamps it, and adds one it lacks', () => {
    const doc = {version: '1.1', tasks: [{id: 'a', title: 'A', due: '2026-11-20', updatedAt: at}]}
    const later = '2026-11-18T11:00:00Z'
    expect(withRecord(doc, 'tasks', 'a', {due: undefined}, later).tasks).toEqual([{id: 'a', title: 'A', updatedAt: later}])
    const added = withRecord(doc, 'views', 'v', {groupBy: 'starred'}, later, {id: 'v', title: 'List', type: 'list', updatedAt: at})
    expect(added.views).toEqual([{id: 'v', title: 'List', type: 'list', groupBy: 'starred', updatedAt: later}])
})

test("en.json has every string the components show", () => {
    const ui = en.plugins.tasks.ui as Record<string, unknown> & { fields: Record<string, string>, options: Record<string, Record<string, string>> }
    const {fields, options, ...strings} = defaultLabels
    expect(Object.keys(strings).filter(k => typeof ui[k] !== 'string')).toEqual([])
    expect(Object.keys(fields).filter(k => !ui.fields[k])).toEqual([])
    expect(Object.keys(options).filter(k => !ui.options[k.split('.')[0]!]?.[k.split('.')[1]!])).toEqual([])
})
