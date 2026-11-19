# Tasks

A [Vertex](https://github.com/CTRL-Neo-Studios/vertex) plugin for `.task` files, written in the
[Tasks format](https://www.npmjs.com/package/@type32/tasks): todos, events and timelines.

- **New Task List** (File → New, Files' menus, the palette) makes a `.task` file with an Inbox list and a List and a
  Board view.
- **The List:** Today, Upcoming, Anytime and Done, or grouped by list, status, priority, tags, a star or a field of
  the file's; a task's editor opens in place (title, notes in Markdown, Do, Due with a time, repeat, list, tags,
  priority, star, status, the file's own fields); the checkbox completes a task, or moves a repeating one to its next
  time; lists beside, added and renamed there.
- **The Board:** a column a status (or a list, a priority, a tag, a star, a field of the file's), empty ones too;
  cards dragged between columns and up and down; a card's editor beside it; New task at a column's foot. Statuses
  added (each with what it means: to do, in progress, done, cancelled), renamed, coloured and deleted on the board.
- **The Calendar:** a month, a week or a day, each time of a repeating task, at the time zone of the settings; a click
  opens a task, a drag moves it or stretches it, a drag on empty hours (or a double click) makes one; moving one time
  of a repeating task asks whether it's that one or all of them. Lists switched on and off beside it.
- **The Timeline:** a Gantt: the outline (subtasks under their parent, folding; length, progress) beside bars on a
  day, week or month scale, moments as diamonds, dues as marks, a parent's stretch, dependency lines and today's line.
  A bar dragged or stretched moves its task; a line drawn from the dot after a bar to another row makes that task wait
  for it (one that would make a loop is refused); a right click: Edit, Duplicate, its list (its colour), the
  dependencies to remove, Delete.
- **Views** are the file's (the format's `views`), so other apps of the format show the same ones. Add a view, name
  it, group, sort and hide done tasks in its options.
- A file is written back in the format it was found in (YAML, JSON or TOML), keeping what the plugin doesn't know. A
  file that doesn't read shows what's wrong and isn't written over.
- **The Tasks panel** (right sidebar): Overdue, Today and Upcoming across every `.task` file and every note that is a
  task (`task:` in its frontmatter, the format's Markdown task file). Tick one to complete it in its own file; click
  one to open its note, or its file at that task.
- **The Tasks window** (palette: Open Tasks in a window): the panel's list in a small window of its own, which can be
  kept on top. It reaches nothing of the workspace itself: ticks and clicks there are done by the workspace's window.
- **In a chat** (with Chat on): the model can list the workspace's tasks (by text, file or dates), and in Suggest or
  Write mode add one to the inbox file, complete, rename or reschedule one, or delete one, each after you approve it.
  Before you do, the chat shows the task as it will be added, before and after the change, or the task that goes.
- **A calendar can show the workspace's tasks** (its options): the notes' and the other files' tasks beside its own,
  each edit written to the file it's in.
- **`![[file.task]]`** in a note draws the file's first view, and works.
- **Links** in tasks' notes count in backlinks and the graph, and follow renames.
- **Make this note a task** in a note's menu in Files, and in the palette for the shown note.
- **iCalendar:** File → Import from iCalendar… merges a calendar (events and to-dos, by UID) into the shown `.task`
  file and lists what it couldn't take; Export to iCalendar… writes the file as `.ics`.
- **The palette:** Show Tasks panel; New task… (into the file the settings name, `Inbox.task` by default); and the
  workspace's open tasks, found by their title.
- **Alerts:** a notification when a task with a due time is due, while Vertex has its workspace open; once each. It
  asks for the `notifications` permission.
- **Bases layouts** (with Bases on): Calendar (Tasks) and Timeline (Tasks) for any base, timed by the properties you
  pick in Configure view (`start`, `end` and `due` by default). Dragging an item writes its note's dates; a click opens
  the note; a double click on an empty day makes a new one with that date.

Settings: the first day of the week, the time zone that decides which day is today, where new tasks go, and alerts.

Notes' tasks are written with Vertex's frontmatter writer (as Bases writes properties); the body isn't touched.

## Install

Settings → Plugins → Install…, and paste `https://github.com/CTRL-Neo-Studios/vertex-plugin-tasks`. It needs a Vertex
with plugin windows and chat tools (SDK 1.6.0's contract); an older one refuses its manifest.

## What it shows of the plugin API

| | Where | Docs |
| --- | --- | --- |
| A file type with New, a viewer that loads its text, an embed | `src/main.ts`, `src/TaskViewer.vue`, `src/TaskEmbed.vue` | [`ctx.files.type`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxfilestype), [`ctx.views.fileViewer`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxviewsfileviewer), [`ctx.editor.embed`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxeditorembed) |
| A component library of its own, drawn with Vertex's Nuxt UI | `src/TaskFile.vue`, `@type32/tasks-ui-components` | [Nuxt UI](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/ui.md#nuxt-ui), [Dependencies](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/package.md#dependencies) |
| Links in its files for backlinks and renames | `src/links.ts` | [`ctx.index.linkExtractor`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxindexlinkextractor) |
| The workspace's tasks from the index and the files, edits as one undo step, frontmatter written as Obsidian does | `src/workspace.ts` | [The index](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/session.md#sessionindexfiles-sessionindexbypath-sessionindexbyuuid), [`session.files.edit`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/session.md#sessionfilesedit), [`vault`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/session.md#sessionfilesvault) |
| A panel view, an overlay, commands and a palette group | `src/main.ts`, `src/commands.ts`, `src/TasksPanel.vue`, `src/TasksOverlay.vue` | [`ctx.views.panel`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxviewspanel), [`ctx.views.overlay`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxviewsoverlay), [`ctx.commands.register`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxcommandsregister) |
| An item in Files' menu | `src/main.ts` | [`ctx.files.menuItem`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxfilesmenuitem) |
| Open and Save dialogs, reading and writing what's picked | `src/commands.ts` (iCalendar) | [`ctx.dialogs`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxdialogsreadtext-ctxdialogswritetext) |
| Notifications behind a permission, data kept on the device | `src/alerts.ts`, `plugin.json` | [`ctx.notifications.send`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxnotificationssend), [`ctx.data`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/config.md#ctxdataglobal-ctxdataworkspace) |
| Bases layouts, when Bases runs | `src/main.ts`, `src/BaseLayout.vue` | [`ctx.whenPlugin`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxprovide-ctxuse-ctxwhenplugin) |
| A window of its own, talking to the workspace's window | `src/tasksWindow.ts`, `src/TasksWindow.vue` | [`ctx.windows`](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxwindowsdefine-ctxwindowsopen-ctxwindowsisopen) |
| Tools for a chat's model, with previews of what they change | `src/chatTools.ts`, `src/ToolPreview.vue` | [Other plugins](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/context.md#ctxprovide-ctxuse-ctxwhenplugin) |
| Settings a workspace may change | `plugin.json` | [The schema](https://github.com/CTRL-Neo-Studios/vertex/blob/dev/packages/vertex-plugin/docs/config.md#the-schema) |

## Develop

```sh
bun install
bun test            # the format's files, notes' tasks, dates, the agenda, alerts, Bases rows, the chat tools' queries
bun run typecheck
bun run build       # dist/ (with this README) and plugin.zip
```

Install `dist/` in Vertex (Settings → Plugins → Install… ▾ → From a folder) and run `bunx vite build --watch`.
