<script setup lang="ts">
/**
 * `![[x.task]]` in a note: the file's first view, working as in its tab. The text is read when the file changes and
 * each edit is written back as one step of Files' undo (open tabs of the file reload).
 */
import type {EmbedProps} from '@type32/vertex-plugin'
import {computed, ref, watch} from 'vue'
import {t} from './context'
import TaskFile from './TaskFile.vue'

const props = defineProps<EmbedProps>()
const session = props.host.session

const entry = computed(() => session.index.files().find(f => !f.isFolder && f.relativePath === props.filePath))
const content = ref<string>()
// The text last read from the file or written to it, so the embed's own writes aren't read back.
let known: string | undefined
watch(() => entry.value && `${entry.value.uuid}\u0000${new Date(entry.value.modifiedTime).getTime()}`, async (version) => {
    if (!version) return
    const text = await session.files.vault().read(props.filePath)
    if (text === known) return
    known = content.value = text
}, {immediate: true})

function save(text: string) {
    if (text === known || !entry.value) return
    known = content.value = text
    void session.files.edit([{uuid: entry.value.uuid, text}], t('embed.edit', {name: entry.value.fileName}))
}
</script>

<template>
  <div class="tw:flex tw:flex-col tw:overflow-hidden tw:rounded-md tw:border tw:border-default" :class="card ? 'tw:h-full' : 'tw:h-96'" data-task-embed>
    <p v-if="!entry" class="tw:p-4 tw:text-sm tw:text-muted">{{ t('embed.missing', {path: filePath}) }}</p>
    <TaskFile
      v-else-if="content !== undefined"
      :model-value="content"
      :file-id="entry.uuid"
      :note-path="filePath"
      :session="session"
      @update:model-value="save"
    />
  </div>
</template>
