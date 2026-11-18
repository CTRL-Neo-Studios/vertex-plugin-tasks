import {type Format, type Issue, parse, type List, type Task, type TaskDocument, TasksFormatError, validate, type View} from '@type32/tasks'
import {applyPatch, type Patch} from '@type32/tasks-ui-components'

/**
 * What a `.task` file's text is written in: JSON when it starts with `{`, TOML when its first statement is `key = …`
 * or a `[table]`, YAML otherwise (a new file too).
 */
export function sniff(text: string): Format {
    const first = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).find(l => l && !l.startsWith('#'))
    if (first === undefined) return 'yaml'
    if (first.startsWith('{')) return 'json'
    if (/^\[\[?[^\]]+\]\]?$/.test(first) || /^[\w"'.-]+\s*=/.test(first)) return 'toml'
    return 'yaml'
}

export type Read =
    | { doc: TaskDocument, format: Format, created: boolean }
    | { issues: Issue[], format: Format }

/** What a new file holds: one list, and a List and a Board view (titles in the user's language). */
export interface NewNames {
    list: string
    listView: string
    boardView: string
}

/** The file's text read: an empty file is a new document (`created`, to be written once); a broken one, its issues. */
export function read(text: string, names: NewNames, now: string): Read {
    const format = sniff(text)
    if (!text.trim()) {
        return {
            format,
            created: true,
            doc: {
                version: '1.1',
                lists: [{id: crypto.randomUUID(), title: names.list, color: '#3b82f6', updatedAt: now}],
                views: [
                    {id: crypto.randomUUID(), title: names.listView, type: 'list', updatedAt: now},
                    {id: crypto.randomUUID(), title: names.boardView, type: 'board', groupBy: 'values.status', updatedAt: now},
                ],
                tasks: [],
            },
        }
    }
    try {
        return {doc: parse(text, format), format, created: false}
    } catch (error) {
        if (error instanceof TasksFormatError) return {issues: error.issues, format}
        throw error
    }
}

export type Collection = 'tasks' | 'lists' | 'views'
export type RecordOf<C extends Collection> = { tasks: Task, lists: List, views: View }[C]

/** `doc` with one record of a collection changed (`updatedAt` stamped), or added when it isn't there. */
export function withRecord<C extends Collection>(doc: TaskDocument, collection: C, id: string, patch: Patch<RecordOf<C>>, now: string, added?: RecordOf<C>): TaskDocument {
    const records = (doc[collection] ?? []) as RecordOf<C>[]
    const at = records.findIndex(r => r.id === id)
    const next = at === -1
        ? [...records, applyPatch((added ?? patch) as RecordOf<C>, patch, now)]
        : records.map((r, i) => (i === at ? applyPatch(r, patch, now) : r))
    return {...doc, [collection]: next}
}

/**
 * Checks a note's task as the format reads a task file alone: its shape, its times and its values against the built-in
 * fields. `listId`, `parentId` and `dependsOn` name records of a document a note isn't in, so they aren't checked.
 * Throws `TasksFormatError`.
 */
export function checkNoteTask(task: Task) {
    const {listId: _l, parentId: _p, dependsOn: _d, ...alone} = task
    validate({version: '1.1', tasks: [alone]})
}

/** A note's `task:` (its frontmatter's) when it's a task the format takes; `notes` is the body, never a key. */
export function noteTask(raw: unknown): Task | undefined {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || 'notes' in raw) return undefined
    try {
        checkNoteTask(raw as Task)
        return raw as Task
    } catch {
        return undefined
    }
}
