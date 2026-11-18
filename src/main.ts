import {definePlugin} from '@type32/vertex-plugin'
import '@type32/tasks-ui-components/style.css'
import './style.css'

export default definePlugin({
    setup(ctx) {
        ctx.views.fileViewer({
            id: 'tasks',
            match: ext => ext === 'task',
            loadsText: true,
            component: () => import('./TaskViewer.vue'),
        })
    },
})
