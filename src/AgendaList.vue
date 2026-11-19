<script setup lang="ts">
/** The agenda's groups as the Tasks panel and the Tasks window draw them: a checkbox completes, a title opens. */
import {today as todayIn} from '@internationalized/date'
import {formatTime} from '@type32/tasks-ui-components'
import {computed} from 'vue'
import type {AgendaGroup} from './agenda'
import {context, t, timeZone} from './context'

defineProps<{ groups: AgendaGroup[] }>()
const emit = defineEmits<{ complete: [key: string], open: [key: string] }>()
const ctx = context()
const today = computed(() => todayIn(timeZone.value))
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-3 tw:p-2" data-tasks-panel>
    <p v-if="groups.length === 0" class="tw:px-2 tw:py-6 tw:text-center tw:text-sm tw:text-muted">{{ t('panel.empty') }}</p>
    <section v-for="group in groups" :key="group.id" :data-group="group.id">
      <h3 class="tw:flex tw:items-center tw:gap-1.5 tw:px-2 tw:pb-1 tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide" :class="group.id === 'overdue' ? 'tw:text-error' : 'tw:text-muted'">
        {{ t(`panel.${group.id}`) }}
        <span class="tw:font-normal">{{ group.rows.length }}</span>
      </h3>
      <ul>
        <li v-for="row in group.rows" :key="row.key" class="tw:flex tw:items-start tw:gap-2 tw:rounded-md tw:px-2 tw:py-1 tw:hover:bg-elevated/60" :data-task="row.key">
          <!-- Native: hundreds of rows mount in a frame, where Nuxt UI's checkbox (a Reka component each) didn't. -->
          <input
            type="checkbox"
            class="tw:mt-1 tw:size-3.5 tw:shrink-0 tw:accent-primary"
            :aria-label="row.title"
            @change="emit('complete', row.key); ($event.target as HTMLInputElement).checked = false"
          >
          <button type="button" class="tw:min-w-0 tw:flex-1 tw:text-start" @click="emit('open', row.key)">
            <span class="tw:block tw:truncate tw:text-sm tw:text-highlighted">{{ row.title }}</span>
            <span class="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-muted">
              <span :class="group.id === 'overdue' && 'tw:text-error'">{{ formatTime(row.when, ctx.i18n.locale, today) }}</span>
              <span>·</span>
              <UIcon :name="row.note ? 'i-lucide-file-text' : 'i-lucide-list-checks'" class="tw:size-3 tw:shrink-0" />
              <span class="tw:truncate">{{ row.source }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
