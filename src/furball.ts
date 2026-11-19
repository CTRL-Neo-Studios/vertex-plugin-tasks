import {today as todayIn} from '@internationalized/date'
import {formatTime} from '@type32/tasks-ui-components'
import type {PluginContext, SessionContext} from '@type32/vertex-plugin'
import {computed, onScopeDispose} from 'vue'
import {agenda} from './agenda'
import {type Config, t, timeZone} from './context'
import type {FurballApi} from './furball-api'
import {completeEntry, openTask, workspaceTasks} from './workspace'

/**
 * With Furball on: the workspace's Overdue and Today, for its kitty to hold up and list. A tick in its bubble
 * completes the task, a click on a title opens it. Removed with the session's scope.
 */
export function feedFurball(ctx: PluginContext<Config>, session: SessionContext, furball: FurballApi) {
    if (!session.session.workspaceSession) return
    const store = workspaceTasks(session)
    const items = computed(() => {
        const today = todayIn(timeZone.value)
        return agenda(store.entries.value, today, timeZone.value)
            .filter(group => group.id !== 'upcoming')
            .flatMap(group => group.rows.map(row => ({
                id: row.key,
                title: row.title,
                when: formatTime(row.when, ctx.i18n.locale, today),
                late: group.id === 'overdue',
            })))
    })
    const entry = (key: string) => store.entries.value.find(e => e.key === key)
    onScopeDispose(furball.source({
        id: 'tasks',
        label: t('panel.title'),
        items: () => items.value,
        done: (key) => {
            const found = entry(key)
            return found && completeEntry(store, found)
        },
        open: (key) => {
            const found = entry(key)
            if (found) openTask(session, found)
        },
    }))
}
