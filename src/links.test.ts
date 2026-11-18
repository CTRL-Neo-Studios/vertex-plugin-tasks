import {expect, mock, test} from 'bun:test'
import {parse, stringify} from '@type32/tasks'

// The SDK's modules are the host's at run time (types only in the package): stand-ins that read `[[target…]]`.
const LINK = /\[\[([^\]|#]+)([^\]]*)\]\]/g
const getInternalLinks = (text: string) => [...text.matchAll(LINK)].map(m => ({path: m[1]!}))
mock.module('@type32/vertex-plugin/links', () => ({
    getInternalLinks,
    rewriteLinks(text: string, rename: Map<string, string>) {
        let count = 0
        const out = text.replace(LINK, (whole, path: string, rest: string) => (rename.has(path) ? (count++, `[[${rename.get(path)}${rest}]]`) : whole))
        return {text: out, count}
    },
}))
const {rewriteTaskLinks, taskLinkTargets} = await import('./links')

const at = '2026-11-18T10:00:00Z'
const doc = {
    version: '1.1',
    tasks: [
        {id: 'a', title: 'A', notes: 'See [[Brief]] and [[Brief#Scope|the scope]].', updatedAt: at},
        {id: 'b', title: 'B', notes: 'No links', updatedAt: at},
        {id: 'c', title: 'C', notes: '[[Old]]', deletedAt: at, updatedAt: at},
    ],
}

test("a .task file's links are its live tasks' notes'; one that doesn't parse has none", () => {
    expect(taskLinkTargets(stringify(doc, 'yaml'), getInternalLinks)).toEqual(['Brief', 'Brief'])
    expect(taskLinkTargets('tasks: [', getInternalLinks)).toEqual([])
})

test("a rename rewrites the notes in the file's own format and stamps the task it changed", () => {
    const text = stringify(doc, 'toml')
    const later = '2026-11-19T10:00:00Z'
    const out = rewriteTaskLinks(text, new Map([['Brief', 'Plans/Brief 2']]), later)
    expect(out.count).toBe(2)
    const after = parse(out.text, 'toml')
    expect(after.tasks[0]).toMatchObject({notes: 'See [[Plans/Brief 2]] and [[Plans/Brief 2#Scope|the scope]].', updatedAt: later})
    expect(after.tasks[1]!.updatedAt).toBe(at)
    expect(rewriteTaskLinks(text, new Map([['Nothing', 'Else']]))).toEqual({text, count: 0})
})
