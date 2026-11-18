<script setup lang="ts">
/**
 * The workspace's open tasks with a date, from every `.task` file and task note: Overdue (due and past), Today (Do or
 * Due by today) and Upcoming, each by day. The checkbox completes a task (a repeating one moves to its next time) in
 * its own file; the title opens it there.
 */
import {type CalendarDate, today as todayIn} from '@internationalized/date'
import {isOpen, isOverdue, TasksFormatError} from '@type32/tasks'
import {dayOf, formatTime, toggleDone} from '@type32/tasks-ui-components'
import type {PanelViewProps} from '@type32/vertex-plugin'
import {useToast} from '@nuxt/ui/composables'
import {computed} from 'vue'
import {context, t, timeZone} from './context'
import {openTask, type WorkspaceTask, workspaceTasks} from './workspace'

const props = defineProps<PanelViewProps>()
const ctx = context()
const toast = useToast()
const store = workspaceTasks(props.session)
const today = computed(() => todayIn(timeZone.value))

interface Row { entry: WorkspaceTask, day: CalendarDate, when: string }
const groups = computed(() => {
    const [overdue, now, upcoming]: Row[][] = [[], [], []]
    for (const entry of store.entries.value) {
        const {task, fields} = entry
        if (!isOpen(task, fields)) continue
        const times = [task.start, task.due].filter(v => v !== undefined)
        if (times.length === 0) continue
        const day = times.map(v => dayOf(v, task.timeZone, timeZone.value)).reduce((a, b) => (b.compare(a) < 0 ? b : a))
        const row = {entry, day, when: task.due ?? task.start!}
        if (isOverdue(task, fields, {timeZone: timeZone.value})) overdue.push(row)
        else (day.compare(today.value) <= 0 ? now : upcoming).push(row)
    }
    const byDay = (a: Row, b: Row) => a.day.compare(b.day) || a.entry.task.title.localeCompare(b.entry.task.title)
    return [
        {id: 'overdue', rows: overdue.sort(byDay)},
        {id: 'today', rows: now.sort(byDay)},
        {id: 'upcoming', rows: upcoming.sort(byDay)},
    ].filter(g => g.rows.length)
})

const source = (entry: WorkspaceTask) => entry.path.slice(entry.path.lastIndexOf('/') + 1).replace(/\.(md|task)$/i, '')
function complete(entry: WorkspaceTask) {
    store.change(entry, toggleDone(entry.task, entry.fields, new Date().toISOString())).catch((error: unknown) => {
        toast.add({title: t('refused'), description: error instanceof TasksFormatError ? error.message : String(error), color: 'error', icon: 'i-lucide-circle-alert'})
    })
}
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-3 tw:p-2" data-tasks-panel>
    <p v-if="groups.length === 0" class="tw:px-2 tw:py-6 tw:text-center tw:text-sm tw:text-muted">{{ t('panel.empty') }}</p>
    <section v-for="group in groups" :key="group.id" :data-group="group.id">
      <h3 class="tw:flex tw:items-center tw:gap-1.5 tw:px-2 tw:pb-1 tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide" :class="group.id === 'overdue' ? 'tw:text-error' : 'tw:text-muted'">
        {{ t(`panel.${group.id}`) }}
        <span class="tw:font-normal">{{ group.rows.length }}</span>
      </h3>
      <ul>
        <li v-for="row in group.rows" :key="row.entry.key" class="tw:flex tw:items-start tw:gap-2 tw:rounded-md tw:px-2 tw:py-1 tw:hover:bg-elevated/60" :data-task="row.entry.key">
          <!-- Native: hundreds of rows mount in a frame, where Nuxt UI's checkbox (a Reka component each) didn't. -->
          <input
            type="checkbox"
            class="tw:mt-1 tw:size-3.5 tw:shrink-0 tw:accent-primary"
            :aria-label="row.entry.task.title"
            @change="complete(row.entry); ($event.target as HTMLInputElement).checked = false"
          >
          <button type="button" class="tw:min-w-0 tw:flex-1 tw:text-start" @click="openTask(session, row.entry)">
            <span class="tw:block tw:truncate tw:text-sm tw:text-highlighted">{{ row.entry.task.title }}</span>
            <span class="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-muted">
              <span :class="group.id === 'overdue' && 'tw:text-error'">{{ formatTime(row.when, ctx.i18n.locale, today) }}</span>
              <span>·</span>
              <UIcon :name="row.entry.note ? 'i-lucide-file-text' : 'i-lucide-list-checks'" class="tw:size-3 tw:shrink-0" />
              <span class="tw:truncate">{{ source(row.entry) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
