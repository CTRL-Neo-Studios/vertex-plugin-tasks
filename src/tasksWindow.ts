import {today as todayIn} from '@internationalized/date'
import type {PluginContext, SessionContext, WindowMessage} from '@type32/vertex-plugin'
import {effectScope, toRaw, watch} from 'vue'
import {agenda} from './agenda'
import {type Config, timeZone} from './context'
import {completeEntry, openTask, workspaceTasks} from './workspace'

/** The sessions whose Tasks window is open and being sent the agenda. */
const wired = new WeakSet<object>()

/**
 * Opens the Tasks window (or brings it forward) and, the first time, feeds it from this session: the agenda each time
 * it changes or the window asks (`ready`), and what the window asks done (`complete`, `open`) done here, with the
 * session's API. The feeding stops when the window closes.
 */
export async function openTasksWindow(ctx: PluginContext<Config>, session: SessionContext) {
    const window = await ctx.windows.open('list')
    if (wired.has(toRaw(session))) return
    wired.add(toRaw(session))
    const store = workspaceTasks(session)
    const scope = effectScope(true)
    const send = () => void window.post({groups: agenda(store.entries.value, todayIn(timeZone.value), timeZone.value) as unknown as WindowMessage}).catch(() => {})
    scope.run(() => watch([store.entries, timeZone], send))
    const stop = window.on((message) => {
        if (!message || typeof message !== 'object' || Array.isArray(message)) return
        if (message.type === 'ready') return send()
        const entry = store.entries.value.find(e => e.key === message.key)
        if (!entry) return
        if (message.type === 'complete') void completeEntry(store, entry).catch(error => console.error('[tasks] window:', error))
        if (message.type === 'open') openTask(session, entry)
    })
    void window.closed.then(() => {
        scope.stop()
        stop()
        wired.delete(toRaw(session))
    })
}
