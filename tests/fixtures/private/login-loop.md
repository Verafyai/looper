---
id: login-loop
name: Login loop
routine_id: routine-login
status: running
schedule:
  cron: "0 7 * * *"
  words: Daily at 7:00 AM PT
  timezone: America/Los_Angeles
owner: JD
created: "2026-10-05"
kpis:
  quality: 70
okrs:
  - name: Quality
    kpi: quality
    target: 100
    unit: score
    weight: 1
---

## Evaluation and measurement

- Quality against the target

## Sources and instructions

- The account session

## Quality control

The owner reviews flags.

## Roadmap

- Read the inbox

## Run history and notes

The account login expired.
