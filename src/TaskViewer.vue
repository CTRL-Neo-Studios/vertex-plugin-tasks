<script setup lang="ts">
/**
 * A `.task` file in its tab. The text is parsed once and kept as a document; each edit changes the document, which is
 * checked whole (an edit that would break it is refused) and written back in the file's own format after a pause; the
 * tab autosaves what comes back. A file that doesn't parse shows why and is never written. An empty file is a new
 * document, written at once. Text the tab reloads (changed by another program) is read again.
 */
import {useToast} from '@nuxt/ui/composables'
import {type List, resolveFields, stringify, type Task, type TaskDocument, TasksFormatError, validate, type View} from '@type32/tasks'
import {type Patch, TaskList} from '@type32/tasks-ui-components'
import type {SessionContext} from '@type32/vertex-plugin'
import {ViewerLayout} from '@type32/vertex-plugin/ui'
import {computed, onBeforeUnmount, ref, shallowRef, watch} from 'vue'
import {context, labels, t, timeZone, weekStartsOn} from './context'
import {read, type RecordOf, withRecord} from './document'
import ViewBar from './ViewBar.vue'
import TaskNotes from './TaskNotes.vue'

const fileName = defineModel<string>('fileName')
const content = defineModel<string>({default: ''})
defineModel<boolean>('contentSaved', {default: false})
const props = defineProps<{ filePath: string, renaming: boolean, session: SessionContext }>()
const emit = defineEmits<{ rename: [oldName: string] }>()

const ctx = context()
const toast = useToast()
const now = () => new Date().toISOString()
const names = () => ({list: t('newFile.list'), listView: t('views.types.list'), boardView: t('views.types.board')})

// Text ↔ document. `written` is the last text this viewer produced, so its own saves aren't read back.
let written = content.value
const state = shallowRef(read(content.value, names(), now()))
const doc = computed(() => ('doc' in state.value ? state.value.doc : undefined))
const issues = computed(() => ('issues' in state.value ? state.value.issues : []))

let pending: ReturnType<typeof setTimeout> | undefined
function write() {
    clearTimeout(pending)
    pending = undefined
    if (!doc.value) return
    written = stringify(doc.value, state.value.format)
    content.value = written
}
if ('created' in state.value && state.value.created) write()
onBeforeUnmount(() => pending !== undefined && write())

watch(content, (text) => {
    if (text === written) return
    written = text
    clearTimeout(pending)
    pending = undefined
    state.value = read(text, names(), now())
})

/** An edit: the document checked whole, then kept and written after a pause; one that would break it is refused. */
function commit(next: TaskDocument) {
    try {
        validate(next)
    } catch (error) {
        if (!(error instanceof TasksFormatError)) throw error
        toast.add({title: t('refused'), description: error.message, color: 'error', icon: 'i-lucide-circle-alert'})
        return
    }
    state.value = {doc: next, format: state.value.format, created: false}
    clearTimeout(pending)
    pending = setTimeout(write, 300)
}

const fields = computed(() => resolveFields(doc.value ?? {}))
// The file's views; a file without any shows a List, written only once its options change.
const fallback = computed((): View => ({id: 'list', title: t('views.types.list'), type: 'list', updatedAt: '1970-01-01T00:00:00Z'}))
const views = computed(() => {
    const own = (doc.value?.views ?? []).filter(v => !v.deletedAt)
    return own.length ? own : [fallback.value]
})
const activeId = ref<string>()
const active = computed(() => views.value.find(v => v.id === activeId.value) ?? views.value[0]!)

/** A record changed, or added (`added`) when the document doesn't have it: the fallback List once its options change. */
function edit<C extends 'tasks' | 'lists' | 'views'>(collection: C, id: string, patch: Patch<RecordOf<C>>, added?: RecordOf<C>) {
    if (doc.value) commit(withRecord(doc.value, collection, id, patch, now(), added))
}
const changeTask = (id: string, patch: Patch<Task>) => edit('tasks', id, patch)
const createTask = (task: Task) => edit('tasks', task.id, {}, task)
const changeList = (id: string, patch: Patch<List>) => edit('lists', id, patch)
const createList = (list: List) => edit('lists', list.id, {}, list)
const changeView = (id: string, patch: Patch<View>) => edit('views', id, patch, fallback.value)
const removeView = (id: string) => changeView(id, {deletedAt: now()})
function addView(type: string) {
    const view: View = {id: crypto.randomUUID(), title: t(`views.types.${type}`), type, ...(type === 'board' && {groupBy: 'values.status'}), updatedAt: now()}
    edit('views', view.id, {}, view)
    activeId.value = view.id
}
</script>

<template>
  <ViewerLayout
    v-model:file-name="fileName"
    scroll-mode="none"
    :file-path="filePath"
    :renaming="renaming"
    :show-status-bar="false"
    :bottom-spacing="false"
    content-alignment="stretch"
    content-max-width="max-w-none"
    @on-rename="(oldName: string) => emit('rename', oldName)"
  >
    <div v-if="!doc" class="tw:mx-auto tw:flex tw:max-w-2xl tw:flex-col tw:gap-3 tw:p-8" data-tasks-problems>
      <p class="tw:font-medium tw:text-highlighted">{{ t('problems.title') }}</p>
      <p class="tw:text-sm tw:text-muted">{{ t('problems.help') }}</p>
      <ul class="tw:flex tw:flex-col tw:gap-1 tw:font-mono tw:text-sm">
        <li v-for="(issue, i) in issues" :key="i">
          <span class="tw:text-error">{{ issue.path.join('.') || t('problems.root') }}</span>: {{ issue.message }}
        </li>
      </ul>
    </div>
    <div v-else class="tw:flex tw:h-full tw:min-h-0 tw:flex-col">
      <ViewBar
        :views="views"
        :active="active"
        :fields="fields"
        @select="activeId = $event"
        @change="changeView"
        @add="addView"
        @remove="removeView"
      />
      <TaskList
        v-if="active.type === 'list'"
        class="tw:min-h-0 tw:flex-1"
        :document="doc"
        :view="active"
        :time-zone="timeZone"
        :locale="ctx.i18n.locale"
        :week-starts-on="weekStartsOn"
        :labels="labels"
        @change="changeTask"
        @create="createTask"
        @change-list="changeList"
        @create-list="createList"
      >
        <template #notes="{text, update}">
          <TaskNotes :text="text" :note-path="filePath" @update="update" />
        </template>
      </TaskList>
      <p v-else class="tw:p-8 tw:text-center tw:text-sm tw:text-muted">{{ t('views.unsupported', {type: active.type}) }}</p>
    </div>
  </ViewerLayout>
</template>
