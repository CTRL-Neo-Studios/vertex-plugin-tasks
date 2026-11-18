import {definePlugin, type SessionContext} from '@type32/vertex-plugin'
import '@type32/tasks-ui-components/style.css'
import {watchAlerts} from './alerts'
import {registerCommands} from './commands'
import {type Config, setContext} from './context'
import {rewriteTaskLinks, taskLinkTargets} from './links'
import './style.css'
import {makeNoteTask} from './workspace'

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
        ctx.editor.embed({
            id: 'tasks',
            match: ext => ext === 'task',
            component: () => import('./TaskEmbed.vue'),
        })
        // Links in tasks' notes count in backlinks and the graph, and follow renames.
        ctx.index.linkExtractor({
            id: 'tasks',
            match: ext => ext === 'task',
            targets: taskLinkTargets,
            rewrite: (text, rename) => rewriteTaskLinks(text, rename),
        })
        ctx.views.panel({
            id: 'tasks',
            label: 'plugins.tasks.panel.title',
            icon: 'i-lucide-list-checks',
            defaultArea: 'right',
            scroll: true,
            when: context => context.isWorkspace,
            component: () => import('./TasksPanel.vue'),
        })

        ctx.views.overlay({
            id: 'tasks',
            component: () => import('./TasksOverlay.vue'),
        })

        // This window's session: the commands' and the Files menu's, and the alerts' workspace.
        let session: SessionContext | undefined
        ctx.onSession((s) => {
            session = s
            watchAlerts(ctx, s)
        })
        registerCommands(ctx, () => session)
        // A note's menu in Files: Make this note a task (a `task:` titled as the note, its body untouched).
        ctx.files.menuItem({
            id: 'tasks-make',
            items: ({files}) => {
                const [file] = files
                if (!session || files.length !== 1 || !file || file.isFolder || file.fileExt !== 'md') return []
                if (file.properties?.task && typeof file.properties.task === 'object') return []
                const label = ctx.i18n.t('plugins.tasks.makeTask')
                return [{label, icon: 'i-lucide-list-checks', onSelect: () => makeNoteTask(session!, file, label)}]
            },
        })
    },
})
