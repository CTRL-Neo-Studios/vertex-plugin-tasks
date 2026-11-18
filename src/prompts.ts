import type {Issue} from '@type32/tasks'
import {shallowRef} from 'vue'

/**
 * What a command asks the window's overlay (`TasksOverlay.vue`) to show: commands run outside any component, and a
 * modal or a toast needs one.
 */
export type Prompt =
    | { kind: 'newTask' }
    | { kind: 'imported', file: string, count: number, dropped: Issue[] }
    | { kind: 'notice', title: string, description?: string, error?: boolean, open?: string }

export const prompt = shallowRef<Prompt>()
