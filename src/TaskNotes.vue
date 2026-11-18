<script setup lang="ts">
/**
 * A task's notes in its editor: drawn as Markdown (a read-only `NoteEditor`), edited once clicked, as a canvas card
 * is; the task's title keeps the focus until then. Esc ends editing.
 */
import {NoteEditor} from '@type32/vertex-plugin/ui'
import {ref} from 'vue'
import {labels} from './context'

defineProps<{ text: string, notePath: string }>()
const emit = defineEmits<{ update: [text: string] }>()
const editing = ref(false)
</script>

<template>
  <NoteEditor v-if="editing" :text="text" :note-path="notePath" class="tw:min-h-6" @update="emit('update', $event)" @done="editing = false" />
  <div v-else-if="text" class="tw:cursor-text" data-task-notes @click="editing = true">
    <NoteEditor readonly :text="text" :note-path="notePath" />
  </div>
  <button v-else type="button" class="tw:text-start tw:text-sm tw:text-muted" data-task-notes @click="editing = true">{{ labels.notes }}</button>
</template>
