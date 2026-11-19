<script setup lang="ts">
/**
 * The Tasks window (`ownWindows` `list`): the agenda, as the session window sends it. It reaches nothing of the
 * workspace: a tick or a click goes back over the channel, and the session window does it.
 */
import type {WindowMessage, WindowProps} from '@type32/vertex-plugin'
import {onBeforeUnmount, onMounted, ref, shallowRef} from 'vue'
import type {AgendaGroup} from './agenda'
import AgendaList from './AgendaList.vue'
import {t} from './context'

const props = defineProps<WindowProps>()
const groups = shallowRef<AgendaGroup[]>([])
const onTop = ref(false)

const stop = props.channel.on((message: WindowMessage) => {
    if (message && typeof message === 'object' && !Array.isArray(message) && Array.isArray(message.groups)) {
        groups.value = message.groups as unknown as AgendaGroup[]
    }
})
onBeforeUnmount(stop)
onMounted(() => {
    void props.window.setTitle(t('window.title'))
    void props.channel.post({type: 'ready'})
})

async function toggleTop() {
    onTop.value = !onTop.value
    await props.window.setAlwaysOnTop(onTop.value)
}
</script>

<template>
  <div class="tw:flex tw:h-full tw:min-h-0 tw:flex-col" data-tasks-window>
    <div class="tw:flex tw:justify-end tw:px-2">
      <UToggle
        :model-value="onTop"
        :icon="onTop ? 'i-lucide-pin-off' : 'i-lucide-pin'"
        size="xs"
        active-variant="ghost"
        :title="t(onTop ? 'window.unpin' : 'window.pin')"
        data-tasks-pin
        @click="toggleTop"
      />
    </div>
    <div class="tw:min-h-0 tw:flex-1 tw:overflow-y-auto">
      <AgendaList
        :groups="groups"
        @complete="key => channel.post({type: 'complete', key})"
        @open="key => channel.post({type: 'open', key})"
      />
    </div>
  </div>
</template>
