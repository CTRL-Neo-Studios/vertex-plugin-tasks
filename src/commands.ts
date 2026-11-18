import {today as todayIn} from '@internationalized/date'
import {fromICS, isOpen, isOverdue, merge, parse, stringify, type Task, TasksFormatError, toICS} from '@type32/tasks'
import {dayOf, formatTime} from '@type32/tasks-ui-components'
import type {PluginContext, SessionContext} from '@type32/vertex-plugin'
import {type Config, t, timeZone} from './context'
import {read, sniff} from './document'
import {prompt} from './prompts'
import {makeNoteTask, openTask, workspaceTasks} from './workspace'

const ICS = [{name: 'iCalendar', extensions: ['ics']}]
const now = () => new Date().toISOString()
const notice = (title: string, error: unknown) =>
    (prompt.value = {kind: 'notice', title, description: error instanceof Error ? error.message : String(error), error: true})

/** The shown tab's file, when it's one of the workspace's. */
function shownFile(session: SessionContext | undefined) {
    const id = session?.tabs.active()
    return id ? session!.index.byUuid(id) : undefined
}

/** The palette's and the menu bar's Tasks commands, and the workspace's open tasks as a palette group. */
export function registerCommands(ctx: PluginContext<Config>, current: () => SessionContext | undefined) {
    const shownTaskFile = () => {
        const file = shownFile(current())
        return file?.fileExt === 'task' ? file : undefined
    }
    const shownPlainNote = () => {
        const file = shownFile(current())
        return file?.fileExt === 'md' && !(file.properties?.task && typeof file.properties.task === 'object') ? file : undefined
    }

    ctx.commands.register({
        id: 'show-panel',
        label: 'plugins.tasks.commands.showPanel',
        icon: 'i-lucide-list-checks',
        palette: true,
        enabled: () => !!current(),
        run: () => current()?.views.show('tasks'),
    })
    ctx.commands.register({
        id: 'new-task',
        label: 'plugins.tasks.commands.newTask',
        icon: 'i-lucide-plus',
        palette: true,
        enabled: () => !!current(),
        run: () => (prompt.value = {kind: 'newTask'}),
    })
    ctx.commands.register({
        id: 'make-task',
        label: 'plugins.tasks.makeTask',
        icon: 'i-lucide-list-checks',
        palette: true,
        enabled: () => !!shownPlainNote(),
        run: () => {
            const file = shownPlainNote()
            if (file) void makeNoteTask(current()!, file, t('makeTask')).catch(e => notice(t('makeTask'), e))
        },
    })

    // iCalendar: a calendar merged into the shown `.task` file (tasks by UID, a later copy winning), and the file out.
    ctx.commands.register({
        id: 'import-ics',
        label: 'plugins.tasks.commands.import',
        icon: 'i-lucide-calendar-arrow-down',
        palette: true,
        menu: {section: 'file'},
        enabled: () => !!shownTaskFile(),
        run: async () => {
            const session = current(), file = shownTaskFile()
            if (!session || !file) return
            try {
                const path = await ctx.dialogs.open({title: t('commands.import'), filters: ICS})
                if (!path) return
                const imported = fromICS(await ctx.dialogs.readText(path))
                const text = await session.files.vault().read(file.relativePath)
                const format = sniff(text)
                const before = read(text, {list: t('newFile.list'), listView: t('views.types.list'), boardView: t('views.types.board')}, now())
                if (!('doc' in before)) throw new TasksFormatError(before.issues)
                const {document} = merge(before.doc, imported.document)
                await session.files.edit([{uuid: file.uuid, text: stringify(document, format)}], t('commands.import'))
                prompt.value = {kind: 'imported', file: file.fileName, count: imported.document.tasks.length, dropped: imported.dropped}
            } catch (error) {
                notice(t('commands.importFailed'), error)
            }
        },
    })
    ctx.commands.register({
        id: 'export-ics',
        label: 'plugins.tasks.commands.export',
        icon: 'i-lucide-calendar-arrow-up',
        palette: true,
        menu: {section: 'file'},
        enabled: () => !!shownTaskFile(),
        run: async () => {
            const session = current(), file = shownTaskFile()
            if (!session || !file) return
            try {
                const text = await session.files.vault().read(file.relativePath)
                const ics = toICS(parse(text, sniff(text)))
                const name = file.fileName.replace(/\.task$/i, '')
                const path = await ctx.dialogs.save({title: t('commands.export'), defaultPath: `${name}.ics`, filters: ICS})
                if (!path) return
                await ctx.dialogs.writeText(path, ics)
                prompt.value = {kind: 'notice', title: t('commands.exported', {path})}
            } catch (error) {
                notice(t('commands.exportFailed'), error)
            }
        },
    })

    // The workspace's open tasks, to find one by its title: those with a date first, by day (overdue ones first).
    ctx.commands.paletteGroup({
        id: 'tasks',
        label: () => t('palette.group'),
        order: 60,
        items: () => {
            const session = current()
            if (!session) return []
            const zone = timeZone.value
            const today = todayIn(zone)
            const dayOfTask = (task: Task) => [task.start, task.due].filter(v => v !== undefined).map(v => dayOf(v, task.timeZone, zone))
                .reduce<ReturnType<typeof dayOf> | undefined>((a, b) => (!a || b.compare(a) < 0 ? b : a), undefined)
            return workspaceTasks(session).entries.value
                .filter(e => isOpen(e.task, e.fields))
                .map(e => ({e, day: dayOfTask(e.task)}))
                .sort((a, b) => (a.day && b.day ? a.day.compare(b.day) : a.day ? -1 : b.day ? 1 : 0) || a.e.task.title.localeCompare(b.e.task.title))
                .map(({e}) => {
                    const when = e.task.due ?? e.task.start
                    const source = e.path.slice(e.path.lastIndexOf('/') + 1).replace(/\.(md|task)$/i, '')
                    return {
                        id: e.key,
                        label: e.task.title,
                        description: [when && formatTime(when, ctx.i18n.locale, today), isOverdue(e.task, e.fields, {timeZone: zone}) && t('panel.overdue'), source].filter(Boolean).join(' · '),
                        icon: e.note ? 'i-lucide-file-text' : 'i-lucide-circle',
                        onSelect: () => openTask(session, e),
                    }
                })
        },
    })
}
