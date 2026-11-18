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

Settings: the first day of the week, the time zone that decides which day is today, where new tasks go, and alerts.

Notes' tasks are written with Vertex's frontmatter writer (as Bases writes properties); the body isn't touched.

## Development

```sh
bun install
bun run build      # dist/ and plugin.zip
bun run typecheck
bun test
```

Built with `@type32/vertex-plugin` (Vertex's SDK), `@type32/tasks` and `@type32/tasks-ui-components`. Until their next
releases, the SDK and the components come from the folders beside this one (`file:` in `package.json`, copied on
install: `rm -rf node_modules/@type32/tasks-ui-components && bun install` after rebuilding one).
