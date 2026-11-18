<script setup lang="ts">
/** Asked when one time of a repeating task is dragged: that one alone, or the whole series. */
import {t} from './context'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [choice: 'one' | 'all' | undefined] }>()
</script>

<template>
  <UModal :title="t('occurrence.title')" :description="t('occurrence.description', {title})" @update:open="(open: boolean) => !open && emit('close', undefined)">
    <template #footer>
      <div class="tw:flex tw:w-full tw:justify-end tw:gap-2">
        <UButton color="neutral" variant="ghost" :label="t('occurrence.cancel')" @click="emit('close', undefined)" />
        <UButton color="neutral" variant="outline" :label="t('occurrence.all')" data-occurrence="all" @click="emit('close', 'all')" />
        <UButton :label="t('occurrence.one')" data-occurrence="one" @click="emit('close', 'one')" />
      </div>
    </template>
  </UModal>
</template>
