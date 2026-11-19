<script setup lang="ts">
/**
 * What a chat's `tasks_add`, `tasks_update` or `tasks_delete` will do, shown while the user is asked to approve it:
 * the task as it will be added, before and after, or the task that goes. Worked out by what the run uses
 * (`withNewTask`, `updatePatch`, `findEntry`), from the workspace as it is now.
 */
import type {Fields, List, Task} from '@type32/tasks'
import {applyPatch, TaskSummary} from '@type32/tasks-ui-components'
import type {SessionContext} from '@type32/vertex-plugin'
import {computed, shallowRef, watch} from 'vue'
import {context, inboxPath, labels, newNames, t, timeZone} from './context'
import {withNewTask} from './document'
import {addedFields, type AddInput, findEntry, updatePatch, type UpdateInput} from './taskQuery'
import {workspaceTasks} from './workspace'

const props = defineProps<{ input: unknown, session: SessionContext, kind: 'add' | 'update' | 'delete' }>()

interface Shown {
    /** Where it happens: the file's workspace-relative path. */
    file: string
    note?: boolean
    before?: Task
    after?: Task
    fields?: Fields
    list?: List
    error?: string
}

const store = workspaceTasks(props.session)
const locale = computed(() => context().i18n.locale)
const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** The added task, from the inbox file as it is (read again when the input or the file changes). */
const added = shallowRef<Shown>()
const inbox = computed(() => {
    const path = inboxPath()
    return {path, file: props.session.index.files().find(f => !f.isFolder && f.relativePath === path)}
})
watch([() => props.kind === 'add' && JSON.stringify(props.input), () => inbox.value.file?.modifiedTime], async ([asked]) => {
    if (!asked) return
    const {path, file} = inbox.value
    try {
        const text = file ? await props.session.files.vault().read(path) : ''
        const made = withNewTask(text, addedFields(props.input as AddInput), newNames(), new Date().toISOString())
        added.value = {file: path, after: made.task, fields: made.fields, list: made.list}
    } catch (e) {
        added.value = {file: path, error: message(e)}
    }
}, {immediate: true})

const shown = computed((): Shown | undefined => {
    if (props.kind === 'add') return added.value
    const asked = props.input as UpdateInput
    const entry = findEntry(store.entries.value, asked)
    if (!entry) return {file: asked.file, error: t('tools.preview.notFound', {id: asked.id, file: asked.file})}
    const at = {file: entry.path, note: entry.note, before: entry.task, fields: entry.fields}
    if (props.kind === 'delete') return at
    try {
        const patch = updatePatch(entry, asked, new Date().toISOString())
        return {...at, after: Object.keys(patch).length ? applyPatch(entry.task, patch, new Date().toISOString()) : undefined}
    } catch (e) {
        return {...at, error: message(e)}
    }
})

const heading = computed(() => {
    const s = shown.value
    if (!s) return ''
    if (props.kind === 'add') return t('tools.preview.adds', {file: s.file})
    if (props.kind === 'update') return t(s.after || s.error ? 'tools.preview.changes' : 'tools.preview.unchanged', {file: s.file})
    return t(s.note ? 'tools.preview.deletesNote' : 'tools.preview.deletes', {file: s.file})
})
</script>

<template>
  <div v-if="shown" class="tw:flex tw:w-full tw:flex-col tw:gap-2 tw:rounded-md tw:border tw:border-default tw:p-2 tw:text-sm" :data-tasks-preview="kind">
    <p class="tw:text-xs tw:text-muted">{{ heading }}</p>
    <p v-if="shown.error" class="tw:text-xs tw:text-error tw:break-words">{{ shown.error }}</p>
    <template v-else>
      <div v-if="shown.before" :class="kind === 'delete' ? 'tw:rounded tw:bg-error/10 tw:p-1.5' : shown.after ? 'tw:opacity-60' : ''" data-tasks-preview-before>
        <TaskSummary :task="shown.before" :fields="shown.fields" :time-zone="timeZone" :locale="locale" :labels="labels" />
      </div>
      <UIcon v-if="shown.before && shown.after" name="i-lucide-arrow-down" class="tw:size-4 tw:self-center tw:text-muted" />
      <div v-if="shown.after" :class="kind === 'add' ? 'tw:rounded tw:bg-success/10 tw:p-1.5' : ''" data-tasks-preview-after>
        <TaskSummary :task="shown.after" :fields="shown.fields" :list="shown.list" :time-zone="timeZone" :locale="locale" :labels="labels" />
      </div>
    </template>
  </div>
</template>
