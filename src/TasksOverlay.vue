<script setup lang="ts">
/**
 * Once in each session window: what the Tasks commands show. New task asks for a title and adds it to the inbox file
 * (the `inbox` setting); an import lists what it couldn't take; a notice is a toast.
 */
import {useToast} from '@nuxt/ui/composables'
import type {SessionContext} from '@type32/vertex-plugin'
import {computed, ref, watch} from 'vue'
import {context, t} from './context'
import {prompt} from './prompts'
import {addTask} from './workspace'

const props = defineProps<{ session: SessionContext }>()
const ctx = context()
const toast = useToast()

const inbox = computed(() => ctx.config.value.inbox.trim() || 'Inbox.task')
const title = ref('')
const newTask = computed({
    get: () => prompt.value?.kind === 'newTask',
    set: open => !open && (prompt.value = undefined),
})
const imported = computed(() => (prompt.value?.kind === 'imported' ? prompt.value : undefined))
watch(newTask, () => (title.value = ''))

// A notice is a toast; Open shows the file it names.
watch(prompt, (p) => {
    if (p?.kind !== 'notice') return
    prompt.value = undefined
    const file = p.open && props.session.index.byUuid(p.open)
    toast.add({
        title: p.title,
        description: p.description,
        color: p.error ? 'error' : 'success',
        icon: p.error ? 'i-lucide-circle-alert' : 'i-lucide-check',
        ...(file && {actions: [{label: t('commands.open'), onClick: () => props.session.tabs.open(file.uuid)}]}),
    })
})

async function add() {
    const text = title.value.trim()
    if (!text) return
    try {
        const uuid = await addTask(props.session, inbox.value, text)
        prompt.value = {kind: 'notice', title: t('commands.added', {title: text, file: inbox.value}), open: uuid}
    } catch (error) {
        prompt.value = {kind: 'notice', title: t('commands.addFailed'), description: error instanceof Error ? error.message : String(error), error: true}
    }
}
</script>

<template>
  <UModal v-model:open="newTask" :title="t('commands.newTask')" :description="t('commands.newTaskHelp', {file: inbox})">
    <template #body>
      <form class="tw:flex tw:gap-2" data-tasks-new @submit.prevent="add">
        <UInput v-model="title" autofocus class="tw:flex-1" :placeholder="t('commands.taskTitle')" />
        <UButton type="submit" :label="t('commands.add')" :disabled="!title.trim()" />
      </form>
    </template>
  </UModal>
  <UModal
    :open="!!imported"
    :title="t('commands.imported', {count: imported?.count ?? 0, file: imported?.file ?? ''})"
    :description="imported?.dropped.length ? t('commands.droppedHelp') : t('commands.nothingDropped')"
    @update:open="(open: boolean) => !open && (prompt = undefined)"
  >
    <template v-if="imported?.dropped.length" #body>
      <ul class="tw:flex tw:max-h-80 tw:flex-col tw:gap-1 tw:overflow-y-auto tw:font-mono tw:text-sm" data-tasks-dropped>
        <li v-for="(issue, i) in imported.dropped" :key="i">
          <span class="tw:text-warning">{{ issue.path.join('.') || '·' }}</span>: {{ issue.message }}
        </li>
      </ul>
    </template>
  </UModal>
</template>
