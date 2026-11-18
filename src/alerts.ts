import {today} from '@internationalized/date'
import {onScopeDispose} from 'vue'
import {formatTime} from '@type32/tasks-ui-components'
import type {PluginContext, SessionContext} from '@type32/vertex-plugin'
import {type Config, t, timeZone} from './context'
import {dueNow} from './due'
import {workspaceTasks} from './workspace'

const CHECK_MS = 30_000
const KEEP_MS = 2 * 86_400_000

interface Stored { sent?: Record<string, number> }

/**
 * While this window has a workspace open: a notification when one of its tasks is due (the `alerts` setting). Each
 * once, across windows and relaunches: what's sent is remembered in the plugin's global data (two days, then
 * forgotten) before it's sent.
 */
export function watchAlerts(ctx: PluginContext<Config>, session: SessionContext) {
    if (!session.session.workspaceSession) return
    const store = workspaceTasks(session)
    async function check() {
        if (!ctx.config.value.alerts) return
        const zone = timeZone.value
        const stored = ((await ctx.data.global.get()) as Stored | undefined)?.sent ?? {}
        const due = dueNow(store.entries.value, new Date(), new Set(Object.keys(stored)), zone)
        if (due.length === 0) return
        const now = Date.now()
        const sent = Object.fromEntries(Object.entries(stored).filter(([, at]) => now - at < KEEP_MS))
        for (const d of due) sent[d.key] = now
        await ctx.data.global.set({sent} satisfies Stored)
        for (const d of due) {
            await ctx.notifications.send({
                title: d.entry.task.title,
                body: t('alerts.due', {time: formatTime(d.due, ctx.i18n.locale, today(zone)), file: d.entry.path}),
            }).catch((error: unknown) => console.error('[tasks] alert:', error))
        }
    }
    // The first look once the `.task` files have been read. `onSession` runs this in the session's scope, which ends
    // with the window and when the plugin stops.
    const first = setTimeout(() => void check(), 3_000)
    const timer = setInterval(() => void check(), CHECK_MS)
    onScopeDispose(() => {
        clearTimeout(first)
        clearInterval(timer)
    })
}
