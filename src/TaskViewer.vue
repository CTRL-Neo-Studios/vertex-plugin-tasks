<script setup lang="ts">
/** T0 (Tasks Plan): the file parsed by `@type32/tasks`, and the components library's probe drawn in Vertex. */
import {CalendarDateTime} from '@internationalized/date'
import {parse, TasksFormatError} from '@type32/tasks'
import {TaskProbe} from '@type32/tasks-ui-components'
import type {ViewerProps} from '@type32/vertex-plugin'
import {computed, shallowRef} from 'vue'

const props = defineProps<ViewerProps>()

const parsed = computed(() => {
    try {
        return `${parse(props.modelValue ?? '', 'yaml').tasks.length} tasks`
    } catch (error) {
        if (error instanceof TasksFormatError) return error.message
        throw error
    }
})
// Made with the plugin's import of the package: Nuxt UI's inputs must take it as a date-time. Shallow: a date is
// immutable, and `ref` would type it as a plain object without its private fields.
const when = shallowRef(new CalendarDateTime(2026, 11, 18, 9, 30))
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-4 tw:p-6">
    <p class="tw:text-muted" data-probe="parsed">{{ parsed }}</p>
    <TaskProbe v-model="when" />
  </div>
</template>
