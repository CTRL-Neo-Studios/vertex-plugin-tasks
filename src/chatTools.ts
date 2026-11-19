import type {ChatApi, PluginContext} from '@type32/vertex-plugin'
import {type Config, inboxPath, timeZone} from './context'
import {inFile, listTasks, type ListInput, updatePatch, type UpdateInput} from './taskQuery'
import {addTask, workspaceTasks} from './workspace'

const TIME = {type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}(:\\d{2})?)?$'}
const DAY = {type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$'}
const DATES = 'Dates are the task\'s own wall clock: "2026-05-14" (all day) or "2026-05-14T09:00".'

/** The tools a chat's model gets: list the workspace's tasks, add one to the inbox, change one. */
export function registerChatTools(ctx: PluginContext<Config>, chat: ChatApi) {
    chat.registerTool(ctx.plugin, {
        name: 'list',
        label: 'plugins.tasks.tools.list',
        description: 'List the user\'s tasks (todos, events, deadlines) from .task files and from notes that are tasks: '
            + 'the open ones, or every one with `closed`; by text in the title or notes, by a file, and by the day of '
            + 'their Due (else their Do date), e.g. what\'s due this week or overdue. Returns each task\'s file and id '
            + '(for tasks_update), title, status, Do and Due, and whether it\'s overdue. ' + DATES,
        inputSchema: {
            type: 'object',
            properties: {
                query: {type: 'string', description: 'Text in the title or notes, any case.'},
                from: {...DAY, description: 'Only tasks due (or without a Due, to do) on this day or later.'},
                to: {...DAY, description: 'Only tasks due (or without a Due, to do) on this day or earlier.'},
                file: {type: 'string', description: 'Only this file\'s tasks: its workspace-relative path or name.'},
                closed: {type: 'boolean', description: 'Also the done and cancelled tasks.'},
            },
            additionalProperties: false,
        },
        execute: (input, {session}) => listTasks(workspaceTasks(session).entries.value, input as ListInput, timeZone.value, new Date()),
    })
    chat.registerTool(ctx.plugin, {
        name: 'add',
        label: 'plugins.tasks.tools.add',
        description: 'Add a task to the user\'s inbox task file (made if missing), with a Do date (when to do it) and a '
            + 'Due date (its deadline), both optional. ' + DATES,
        writes: true,
        inputSchema: {
            type: 'object',
            properties: {
                title: {type: 'string', description: 'What to do, e.g. "Call Ann".'},
                do: {...TIME, description: 'When to do it.'},
                due: {...TIME, description: 'When it must be done by.'},
                notes: {type: 'string', description: 'Markdown notes.'},
            },
            required: ['title'],
            additionalProperties: false,
        },
        execute: async (input, {session}) => {
            const {title, do: start, due, notes} = input as { title: string, do?: string, due?: string, notes?: string }
            if (!title?.trim()) throw new Error('A task needs a title.')
            const file = inboxPath()
            const {task} = await addTask(session, file, {title: title.trim(), start, due, notes})
            return {added: {file, id: task.id, title: task.title, ...(start && {do: start}), ...(due && {due})}}
        },
    })
    chat.registerTool(ctx.plugin, {
        name: 'update',
        label: 'plugins.tasks.tools.update',
        description: 'Change one of the user\'s tasks, found with tasks_list (its file and id): complete it (a repeating '
            + 'one moves to its next time) or reopen it, rename it, move its Do date or its Due date, or clear one with '
            + 'null. ' + DATES,
        writes: true,
        inputSchema: {
            type: 'object',
            properties: {
                file: {type: 'string', description: 'The task\'s file, as tasks_list gives it.'},
                id: {type: 'string', description: 'The task\'s id, as tasks_list gives it.'},
                done: {type: 'boolean', description: 'true completes it, false reopens it.'},
                title: {type: 'string', description: 'Its new title.'},
                do: {anyOf: [TIME, {type: 'null'}], description: 'Its new Do date (a day keeps its time of day), or null.'},
                due: {anyOf: [TIME, {type: 'null'}], description: 'Its new Due date, or null.'},
            },
            required: ['file', 'id'],
            additionalProperties: false,
        },
        execute: async (input, {session}) => {
            const asked = input as UpdateInput
            const store = workspaceTasks(session)
            const entry = store.entries.value.find(e => e.task.id === asked.id && inFile(e, asked.file))
            if (!entry) throw new Error(`There's no task "${asked.id}" in "${asked.file}". Use tasks_list for its file and id.`)
            const patch = updatePatch(entry, asked, new Date().toISOString())
            if (Object.keys(patch).length === 0) return {unchanged: true}
            await store.change(entry, patch)
            return {updated: {file: entry.path, id: entry.task.id}}
        },
    })
}
