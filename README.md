# Looper

Looper is the DevRadar app for agent loops. It shows health, score, schedule, cost, goals, and run history.

## Setup

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm start
```

`npm start` listens on `PORT` (default 3000). The app does not call the network at runtime. Inter is self-hosted by Next.js.

## Scripts

- `npm run dev` starts the local server
- `npm run build` builds the app
- `npm start` serves the build
- `npm run lint` runs ESLint
- `npm run typecheck` runs `tsc --noEmit`
- `npm test` runs Vitest
- `npm run fixtures` regenerates `fixtures/` from `scripts/build-fixtures.mjs`

## Data modes

`LOOPER_DATA_MODE` selects the adapter.

### Sample (default)

Leave `LOOPER_DATA_MODE` unset, or set it to `sample`. The app reads the JSON files in `fixtures/`. Every app page shows a Sample data label. The numbers are sample values for the dashboard mock.

### Private

```bash
LOOPER_DATA_MODE=private LOOPER_DATA_DIR=/path/to/loops npm start
```

`LOOPER_DATA_DIR` is a folder of loop files:

- `*.md` with YAML front matter (`id`, `name`, `routine_id`, `status`, `schedule`, `owner`, `created`, `last_run`, `prompt_source`, `kpis`, `okrs`) and the sections Objective, Evaluation and measurement, Sources and instructions, Quality control, Roadmap, and Run history and notes
- `status.json` with `generated_at`, a per-loop entry (`enabled`, `last_run`, `result`, `next_run`, `kpis`), and `one_offs`
- optional `runs/<loop-id>.jsonl`, one run object per line

`README.md`, `EDIT-PROTOCOL.md`, and files whose names start with `_` are skipped. A value of `none defined yet` means the loop has no goals, so it has no score and needs input. Missing numbers render as `no data`. An empty run log renders as `No runs yet`. The score is the weighted average of KPIs normalized from 0 to 100 against their targets. Private mode does not show the sample label.

## Routes

- `/` public home
- `/spec` public spec
- `/looper` dashboard
- `/looper/one-offs` one-offs table
- `/looper/{id}` loop page
- `/looper/{id}/spec` spec and goals
- `/looper/{id}/runs/{n}` one run post
