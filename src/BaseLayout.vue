<script setup lang="ts">
/**
 * The Calendar and the Timeline as Bases layouts (`tasks-calendar`, `tasks-timeline`): a base's shown rows as tasks,
 * timed by the properties the view names (`start`, `end`, `due`; by default the notes' own of those names). A drag
 * writes the note's properties, as Bases' own edits do; a click opens the note; a day drawn on (or double-clicked) on
 * the calendar is Bases' New with that date.
 */
import type {TaskDocument, View} from '@type32/tasks'
import {type TaskPatch, TaskCalendar, TaskTimeline} from '@type32/tasks-ui-components'
import type {BaseViewProps} from '@type32/vertex-plugin'
import {computed} from 'vue'
import {fromMs, noteKey, propertyWrites, rowTask, TIME_KEYS, type BaseKeys, toLocalTime} from './baseRows'
import {context, labels, t, timeZone, weekStartsOn} from './context'
import {setNoteProperties} from './workspace'

const props = defineProps<BaseViewProps>()
const ctx = context()
const base = props.context
const session = base.session

const timeline = computed(() => base.view.value.type === 'tasks-timeline')
const option = (key: string) => {
    const value = base.view.value[key]
    return typeof value === 'string' && value ? value : key
}
const keys = computed((): BaseKeys => ({start: option('start'), end: option('end'), due: option('due')}))

/** A row's time from a property: a note's as it's written (the index's frontmatter), any other as Bases reads it. */
function timeOf(row: (typeof base.result.value.rows)[number], id: string) {
    const key = noteKey(id)
    if (key !== undefined) return toLocalTime(session.index.byPath(`${session.session.rootPath}/${row.path}`)?.properties?.[key])
    const value = row.property(id)
    return value.type === 'Date' ? fromMs(value.ms, value.time) : value.type === 'String' ? toLocalTime(value.value) : undefined
}

const document = computed((): TaskDocument => ({
    version: '1.1',
    tasks: base.result.value.rows.flatMap((row) => {
        const name = row.path.slice(row.path.lastIndexOf('/') + 1).replace(/\.md$/i, '')
        const task = rowTask(row.path, name, Object.fromEntries(TIME_KEYS.map(k => [k, timeOf(row, keys.value[k])])))
        return task ? [task] : []
    }),
}))
const view = computed((): View => ({
    id: base.view.value.name,
    title: base.view.value.name,
    type: timeline.value ? 'timeline' : 'calendar',
    ...(typeof base.view.value.scale === 'string' && {scale: base.view.value.scale}),
    updatedAt: '1970-01-01T00:00:00Z',
}))

const change = (path: string, patch: TaskPatch) =>
    setNoteProperties(session, path, propertyWrites(patch, keys.value), t('bases.moved', {name: path}))
function open(path: string) {
    const file = session.index.byPath(`${session.session.rootPath}/${path}`)
    if (file) session.tabs.open(file.uuid)
}
// A task drawn on the calendar: Bases' New, the start's property set to the day (or the time) it was drawn at.
function create(task: { start?: string }) {
    const key = noteKey(keys.value.start)
    base.newItem(key !== undefined && task.start ? {key, value: task.start} : undefined)
}
// The scale is the base view's own option.
function changeView(patch: Partial<View>) {
    if (typeof patch.scale !== 'string') return
    const name = base.view.value.name
    base.commit({...base.base.value, views: (base.base.value.views ?? []).map(v => (v.name === name ? {...v, scale: patch.scale} : v))})
}
</script>

<template>
  <component
    :is="timeline ? TaskTimeline : TaskCalendar"
    class="tw:h-full tw:min-h-0"
    :class="!base.embed && 'tw:min-h-[32rem]'"
    :document="document"
    :view="view"
    :editor="false"
    :time-zone="timeZone"
    :locale="ctx.i18n.locale"
    :week-starts-on="weekStartsOn"
    :labels="labels"
    @change="change"
    @create="create"
    @open="open"
    @change-view="changeView"
  />
</template>
