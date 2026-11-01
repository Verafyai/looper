---
id: failed-loop
name: Failed loop
routine_id: routine-failed
status: running
schedule:
  cron: "0 8 * * *"
  words: Daily at 8:00 AM PT
  timezone: America/Los_Angeles
owner: JD
created: "2026-10-10"
kpis:
  quality: 10
okrs:
  - name: Quality
    kpi: quality
    target: 100
    unit: score
    weight: 1
---

## Objective

A loop whose last two runs failed.

## Evaluation and measurement

- Quality against the target

## Sources and instructions

- The repo

## Quality control

The owner reviews flags.

## Roadmap

- Run the check

## Run history and notes

The last two runs failed.
