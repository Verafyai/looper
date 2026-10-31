---
id: demo-loop
name: Demo loop
routine_id: routine-demo
status: running
schedule:
  cron: "0 11 * * *"
  words: Daily at 11:00 PM PT
  timezone: America/Los_Angeles
owner: JD
created: "2026-09-01"
last_run: "2026-10-30T06:00:00.000Z"
prompt_source: test
spec_version: "2"
edited: Oct 2
time_limit: 20 min
budget: $1 per run
model: a fast model
kpis:
  quality: 40
okrs:
  - name: Quality
    kpi: quality
    target: 80
    unit: score
    weight: 1
---

## Objective

Keep the docs accurate.

## Evaluation and measurement

- Compare each page with the rubric

## Sources and instructions

- The docs repo

## Quality control

The owner reviews flags.

## Roadmap

- Read the docs
- Write the log post

## Run history and notes

Steady progress.
