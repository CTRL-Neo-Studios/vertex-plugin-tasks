# Tasks

A [Vertex](https://github.com/CTRL-Neo-Studios/vertex) plugin for `.task` files, written in the
[Tasks format](https://www.npmjs.com/package/@type32/tasks): todos, events and timelines, shown as a list of reminders,
a board, a calendar and a timeline.

In progress (Tasks Plan in Vertex's repository). So far a `.task` file opens and shows how many tasks it holds, with
the components library's probe.

## Development

```sh
bun install
bun run build      # dist/ and plugin.zip
bun run typecheck
```

Built with `@type32/vertex-plugin` (Vertex's SDK), `@type32/tasks` and `@type32/tasks-ui-components`. Until their next
releases, the SDK and the components come from the folders beside this one (`file:` in `package.json`).
