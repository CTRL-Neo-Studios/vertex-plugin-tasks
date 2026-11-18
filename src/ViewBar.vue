<script setup lang="ts">
/** The file's views as tabs, Add view, and the shown one's options (name, grouping, sorting, done tasks). */
import type {Fields, View} from '@type32/tasks'
import {boardGroupBy, fieldTitle, type Patch} from '@type32/tasks-ui-components'
import {computed} from 'vue'
import {labels, t} from './context'

const props = defineProps<{
    views: View[]
    active: View
    fields: Fields
}>()
const emit = defineEmits<{
    select: [id: string]
    change: [id: string, patch: Patch<View>]
    add: [type: string]
    remove: [id: string]
}>()

/** The view types this plugin draws, in Add view's order. */
const TYPES = [
    {type: 'list', icon: 'i-lucide-list-checks'},
    {type: 'board', icon: 'i-lucide-square-kanban'},
    {type: 'calendar', icon: 'i-lucide-calendar'},
    {type: 'timeline', icon: 'i-lucide-chart-gantt'},
]
const iconOf = (type: string) => TYPES.find(x => x.type === type)?.icon ?? 'i-lucide-circle-help'
const addItems = computed(() => TYPES.map(({type, icon}) => ({label: t(`views.types.${type}`), icon, onSelect: () => emit('add', type)})))

const NONE = '\u0000none'
const fieldItems = (test: (type: string) => boolean) => Object.values(props.fields)
    .filter(f => !f.deleted && test(f.type))
    .map(f => ({label: fieldTitle(f, labels.value), value: `values.${f.id}`}))
// A board has columns by something: no Date, and the status while the view names nothing.
const board = computed(() => props.active.type === 'board')
const groupValue = computed(() => (board.value ? boardGroupBy(props.active) : props.active.groupBy ?? NONE))
const groupItems = computed(() => [
    ...(board.value ? [] : [{label: t('views.byDate'), value: NONE}]),
    {label: t('views.byList'), value: 'listId'},
    {label: labels.value.starred, value: 'starred'},
    ...fieldItems(type => ['select', 'multiSelect', 'boolean'].includes(type)),
])
const sortItems = computed(() => [
    {label: t('views.fileOrder'), value: NONE},
    ...['title', 'start', 'end', 'due', 'completedAt', 'updatedAt', 'starred'].map(key => ({label: t(`views.sort.${key}`), value: key})),
    ...fieldItems(type => type !== 'multiSelect'),
])
const set = (patch: Patch<View>) => emit('change', props.active.id, patch)
const unset = (value: string) => (value === NONE ? undefined : value)
</script>

<template>
  <div class="tw:flex tw:items-center tw:gap-1 tw:border-b tw:border-default tw:px-3 tw:py-1.5">
    <UButton
      v-for="view in views"
      :key="view.id"
      :icon="iconOf(view.type)"
      :label="view.title"
      size="sm"
      :variant="view.id === active.id ? 'soft' : 'ghost'"
      :color="view.id === active.id ? 'primary' : 'neutral'"
      @click="emit('select', view.id)"
    />
    <UDropdownMenu :items="addItems">
      <UButton icon="i-lucide-plus" size="sm" variant="ghost" color="neutral" :title="t('views.add')" />
    </UDropdownMenu>
    <UPopover>
      <UButton icon="i-lucide-sliders-horizontal" size="sm" variant="ghost" color="neutral" class="tw:ms-auto" :title="t('views.options')" />
      <template #content>
        <div class="tw:flex tw:w-72 tw:flex-col tw:gap-3 tw:p-3 tw:text-sm">
          <UFormField :label="t('views.name')">
            <UInput :model-value="active.title" class="tw:w-full" @change="(e: Event) => set({title: (e.target as HTMLInputElement).value || active.title})" />
          </UFormField>
          <UFormField :label="t('views.groupBy')">
            <USelect :model-value="groupValue" :items="groupItems" class="tw:w-full" @update:model-value="(v: string) => set({groupBy: unset(v)})" />
          </UFormField>
          <UFormField :label="t('views.sortBy')">
            <div class="tw:flex tw:items-center tw:gap-2">
              <USelect :model-value="active.sortBy ?? NONE" :items="sortItems" class="tw:flex-1" @update:model-value="(v: string) => set({sortBy: unset(v)})" />
              <UButton
                :icon="active.sortDescending ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-narrow-wide'"
                size="sm"
                variant="ghost"
                color="neutral"
                :disabled="!active.sortBy"
                :title="t('views.descending')"
                @click="set({sortDescending: active.sortDescending ? undefined : true})"
              />
            </div>
          </UFormField>
          <USwitch :model-value="!!active.openOnly" :label="t('views.openOnly')" @update:model-value="(v: boolean) => set({openOnly: v || undefined})" />
          <USwitch
            v-if="active.type === 'calendar'"
            :model-value="active.workspaceTasks === true"
            :label="t('views.workspaceTasks')"
            :description="t('views.workspaceTasksHelp')"
            @update:model-value="(v: boolean) => set({workspaceTasks: v || undefined})"
          />
          <UButton
            v-if="views.length > 1"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            :label="t('views.delete')"
            class="tw:self-start"
            @click="emit('remove', active.id)"
          />
        </div>
      </template>
    </UPopover>
  </div>
</template>
