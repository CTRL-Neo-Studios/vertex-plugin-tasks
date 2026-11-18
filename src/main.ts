import {definePlugin} from '@type32/vertex-plugin'
import '@type32/tasks-ui-components/style.css'
import {type Config, setContext} from './context'
import './style.css'

export default definePlugin<Config>({
    setup(ctx) {
        setContext(ctx)
        ctx.files.type({
            id: 'task',
            extensions: ['task'],
            icon: 'i-lucide-list-checks',
            label: 'plugins.tasks.fileType',
            new: {label: 'plugins.tasks.new', command: 'plugins.tasks.newCommand', description: 'plugins.tasks.newDescription'},
        })
        ctx.views.fileViewer({
            id: 'tasks',
            match: ext => ext === 'task',
            loadsText: true,
            component: () => import('./TaskViewer.vue'),
        })
    },
})
