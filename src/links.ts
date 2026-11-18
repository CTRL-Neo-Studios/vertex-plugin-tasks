import {parse, stringify, type TaskDocument} from '@type32/tasks'
import {rewriteLinks} from '@type32/vertex-plugin/links'
import {sniff} from './document'

function docOf(text: string) {
    const format = sniff(text)
    try {
        return {doc: parse(text, format), format}
    } catch {
        return undefined
    }
}

/** The link targets in a `.task` file: those in its tasks' notes. A file that doesn't parse has none. */
export function taskLinkTargets(text: string, getInternalLinks: (text: string) => { path: string }[]): string[] {
    return docOf(text)?.doc.tasks.flatMap(t => (t.deletedAt || !t.notes ? [] : getInternalLinks(t.notes).map(l => l.path))) ?? []
}

/** A `.task` file with its tasks' notes' links renamed (each changed task stamped), in its own format. */
export function rewriteTaskLinks(text: string, rename: Map<string, string>, now = new Date().toISOString()): { text: string, count: number } {
    const read = docOf(text)
    if (!read) return {text, count: 0}
    let count = 0
    const tasks = read.doc.tasks.map((task) => {
        if (!task.notes) return task
        const out = rewriteLinks(task.notes, rename)
        if (out.count === 0) return task
        count += out.count
        return {...task, notes: out.text, updatedAt: now}
    })
    return count ? {text: stringify({...read.doc, tasks} satisfies TaskDocument, read.format), count} : {text, count}
}
