import {getLocalTimeZone} from '@internationalized/date'
import {defaultLabels, type TaskLabels} from '@type32/tasks-ui-components'
import type {PluginContext} from '@type32/vertex-plugin'
import {computed} from 'vue'
import type {NewNames} from './document'

export interface Config {
    /** `auto`: the language's. */
    weekStart: 'auto' | 'monday' | 'sunday' | 'saturday'
    /** An IANA zone; empty: the system's. */
    timeZone: string
    /** Where New task… puts a task: a `.task` file's workspace-relative path; empty: `Inbox.task`. */
    inbox: string
    /** A notification when a task with a due time is due. */
    alerts: boolean
}

let current: PluginContext<Config> | undefined

/** Set once by `setup`; what the plugin's components read their context from. */
export function setContext(ctx: PluginContext<Config>) {
    current = ctx
}

export function context(): PluginContext<Config> {
    if (!current) throw new Error('Tasks: used before setup')
    return current
}

/** A string of the plugin's (`plugins.tasks.<key>`). */
export const t = (key: string, params?: Record<string, unknown>) => context().i18n.t(`plugins.tasks.${key}`, params)

/** A new `.task` file's list and views, named in the window's language. */
export const newNames = (): NewNames => ({list: t('newFile.list'), listView: t('views.types.list'), boardView: t('views.types.board')})

/** The components' strings in the window's language: `plugins.tasks.ui.*`, one per key of theirs. */
export const labels = computed((): TaskLabels => {
    void context().i18n.locale
    const translate = (group: Record<string, string>, prefix: string) =>
        Object.fromEntries(Object.keys(group).map(key => [key, t(`${prefix}${key}`)]))
    const {fields, options, ...strings} = defaultLabels
    return {
        ...translate(strings, 'ui.') as Omit<TaskLabels, 'fields' | 'options'>,
        fields: translate(fields, 'ui.fields.'),
        options: translate(options, 'ui.options.'),
    }
})

/** Where New task… and the chat's tasks_add put a task: the `inbox` setting, else `Inbox.task`. */
export const inboxPath = () => context().config.value.inbox.trim() || 'Inbox.task'

/** The viewer's zone: the setting's when it's a zone, else the system's. */
export const timeZone = computed(() => {
    const zone = context().config.value.timeZone.trim()
    if (!zone) return getLocalTimeZone()
    try {
        new Intl.DateTimeFormat('en', {timeZone: zone})
        return zone
    } catch {
        return getLocalTimeZone()
    }
})

const WEEKDAY = {sunday: 0, monday: 1, saturday: 6} as const

/** 0 is Sunday: the setting's, or the language's first day of the week. */
export const weekStartsOn = computed((): 0 | 1 | 6 => {
    const setting = context().config.value.weekStart
    if (setting !== 'auto') return WEEKDAY[setting]
    const locale = new Intl.Locale(context().i18n.locale) as Intl.Locale & { getWeekInfo?(): { firstDay: number }, weekInfo?: { firstDay: number } }
    const firstDay = (locale.getWeekInfo?.() ?? locale.weekInfo)?.firstDay ?? 1
    return (firstDay % 7) as 0 | 1 | 6
})
