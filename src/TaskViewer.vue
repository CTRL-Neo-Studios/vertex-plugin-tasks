<script setup lang="ts">
/**
 * A `.task` file in its tab: `TaskFile` with its views, in Vertex's viewer layout. The tab loads the text and autosaves
 * what comes back; text it reloads (changed by another program) is read again.
 */
import type {SessionContext} from '@type32/vertex-plugin'
import {ViewerLayout} from '@type32/vertex-plugin/ui'
import TaskFile from './TaskFile.vue'

const fileName = defineModel<string>('fileName')
const content = defineModel<string>({default: ''})
defineModel<boolean>('contentSaved', {default: false})
defineProps<{ fileId: string, filePath: string, renaming: boolean, session: SessionContext }>()
const emit = defineEmits<{ rename: [oldName: string] }>()
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
    <TaskFile v-model="content" bar :file-id="fileId" :note-path="filePath" :session="session" />
  </ViewerLayout>
</template>
