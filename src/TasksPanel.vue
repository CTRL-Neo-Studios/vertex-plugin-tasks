<script setup lang="ts">
/**
 * The workspace's open tasks with a date, from every `.task` file and task note (`agenda`). The checkbox completes a
 * task (a repeating one moves to its next time) in its own file; the title opens it there.
 */
import {today as todayIn} from '@internationalized/date'
import {TasksFormatError} from '@type32/tasks'
import type {PanelViewProps} from '@type32/vertex-plugin'
import {useToast} from '@nuxt/ui/composables'
import {computed} from 'vue'
import {agenda} from './agenda'
import AgendaList from './AgendaList.vue'
import {t, timeZone} from './context'
import {completeEntry, openTask, workspaceTasks} from './workspace'

const props = defineProps<PanelViewProps>()
const toast = useToast()
const store = workspaceTasks(props.session)
const groups = computed(() => agenda(store.entries.value, todayIn(timeZone.value), timeZone.value))
const entry = (key: string) => store.entries.value.find(e => e.key === key)
function complete(key: string) {
    const e = entry(key)
    if (!e) return
    completeEntry(store, e).catch((error: unknown) => {
        toast.add({title: t('refused'), description: error instanceof TasksFormatError ? error.message : String(error), color: 'error', icon: 'i-lucide-circle-alert'})
    })
}
function open(key: string) {
    const e = entry(key)
    if (e) openTask(props.session, e)
}
</script>

<template>
  <AgendaList :groups="groups" @complete="complete" @open="open" />
</template>
