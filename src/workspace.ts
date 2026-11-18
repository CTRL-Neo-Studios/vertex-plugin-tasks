import {frontmatterRange} from '@type32/codemirror-rich-obsidian-editor'
import {type Fields, parse, resolveFields, stringify, type Task, type TaskDocument} from '@type32/tasks'
import {applyPatch, type TaskPatch} from '@type32/tasks-ui-components'
import type {SessionContext} from '@type32/vertex-plugin'
import {obsidianYaml, setFrontmatterProperty} from '@type32/vertex-plugin/vault'
import {computed, type ComputedRef, effectScope, shallowRef, toRaw, watch} from 'vue'
import {t} from './context'
import {checkNoteTask, noteTask, sniff, withRecord} from './document'

/** A task of the workspace: in a note's frontmatter (`note`), or in a `.task` file. */
export interface WorkspaceTask {
    /** Unique in the workspace: the file's uuid and the task's id. */
    key: string
    task: Task
    /** Its document's fields; a note's are the built-in ones. */
    fields: Fields
    uuid: string
    /** Workspace-relative. */
    path: string
    note: boolean
}

export interface WorkspaceTasks {
    entries: ComputedRef<WorkspaceTask[]>
    /** Writes a change to the file holding the task, as one step of Files' undo. Throws when the file wouldn't validate. */
    change(entry: WorkspaceTask, patch: TaskPatch): Promise<void>
}

const yaml = obsidianYaml(frontmatterRange)
const BUILT_IN = resolveFields({})

/** A note's text with its `task:` replaced; the body and the other keys as Obsidian writes frontmatter. */
export const withNoteTask = (text: string, task: Task) => setFrontmatterProperty(text, 'task', task, yaml)

const stores = new WeakMap<object, WorkspaceTasks>()

/** A task to show once its `.task` file's tab is drawn: the viewer of that file takes it (and clears it). */
export const focusRequest = shallowRef<{ uuid: string, id: string }>()

/** Opens a task where it is: its note, or its file at that task. */
export function openTask(session: SessionContext, entry: WorkspaceTask) {
    if (!entry.note) focusRequest.value = {uuid: entry.uuid, id: entry.task.id}
    session.tabs.open(entry.uuid)
}

/**
 * The workspace's tasks, one store per session: notes that are tasks, read from the index (`properties.task`, checked
 * once per version of the note), and every `.task` file's tasks, read from disk when the file changes.
 */
export function workspaceTasks(session: SessionContext): WorkspaceTasks {
    const known = stores.get(toRaw(session))
    if (known) return known
    // The store outlives the component that first asked for it: it lives as long as the session.
    const store = effectScope(true).run(() => create(session))!
    stores.set(toRaw(session), store)
    return store
}

function create(session: SessionContext): WorkspaceTasks {
    // A note's `task:` is a new object each time the note is indexed again, so it's the key its check is kept by.
    const checked = new WeakMap<object, Task | null>()
    const notes = computed(() => {
        const out: WorkspaceTask[] = []
        for (const f of session.index.files()) {
            if (f.isFolder || f.fileExt !== 'md') continue
            const raw = toRaw(f.properties)?.task
            if (!raw || typeof raw !== 'object') continue
            let task = checked.get(raw)
            if (task === undefined) checked.set(raw, task = noteTask(raw) ?? null)
            if (task && !task.deletedAt) out.push({key: `${f.uuid}\u0000${task.id}`, task, fields: BUILT_IN, uuid: f.uuid, path: f.relativePath, note: true})
        }
        return out
    })

    // `.task` files, read again when they change; one that doesn't parse has no tasks here.
    interface Loaded { modified: number, path: string, doc?: TaskDocument, fields: Fields }
    const files = computed(() => session.index.files()
        .filter(f => !f.isFolder && f.fileExt === 'task')
        .map(f => ({uuid: f.uuid, path: f.relativePath, modified: new Date(f.modifiedTime).getTime()})))
    const docs = shallowRef(new Map<string, Loaded>())
    let generation = 0
    watch(files, async (list) => {
        const mine = ++generation
        const next = new Map<string, Loaded>()
        await Promise.all(list.map(async (f) => {
            const before = docs.value.get(f.uuid)
            if (before && before.modified === f.modified && before.path === f.path) return next.set(f.uuid, before)
            const text = await session.files.vault().read(f.path).catch(() => '')
            let doc: TaskDocument | undefined
            try {
                doc = text.trim() ? parse(text, sniff(text)) : undefined
            } catch {
                doc = undefined
            }
            next.set(f.uuid, {modified: f.modified, path: f.path, doc, fields: doc ? resolveFields(doc) : BUILT_IN})
        }))
        if (mine === generation) docs.value = next
    }, {immediate: true})

    const entries = computed(() => {
        const out = [...notes.value]
        for (const [uuid, {path, doc, fields}] of docs.value) {
            for (const task of doc?.tasks ?? []) {
                if (!task.deletedAt) out.push({key: `${uuid}\u0000${task.id}`, task, fields, uuid, path, note: false})
            }
        }
        return out
    })

    async function change(entry: WorkspaceTask, patch: TaskPatch) {
        const now = new Date().toISOString()
        const text = await session.files.vault().read(entry.path)
        let next: string
        if (entry.note) {
            // The body is the note's own: notes aren't written from here.
            const {notes: _, ...rest} = patch
            const task = applyPatch(entry.task, rest, now)
            checkNoteTask(task)
            next = withNoteTask(text, task)
        } else {
            const format = sniff(text)
            next = stringify(withRecord(parse(text, format), 'tasks', entry.task.id, patch, now), format)
        }
        await session.files.edit([{uuid: entry.uuid, text: next}], t('workspace.edit', {title: entry.task.title}))
    }

    return {entries, change}
}
