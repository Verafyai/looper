import fs from "node:fs";
import path from "node:path";
import type { Dataset, LoopRecord, OneOff, RunRecord, Summary } from "./types";

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function loadSample(root = process.cwd()): Dataset {
  const dir = path.join(root, "fixtures");
  const loops = readJson<LoopRecord[]>(path.join(dir, "loops.json"));
  const oneOffs = readJson<OneOff[]>(path.join(dir, "one-offs.json"));
  const summary = readJson<Summary>(path.join(dir, "summary.json"));
  const runsByLoop: Record<string, RunRecord[]> = {};
  const runsDir = path.join(dir, "runs");
  for (const file of fs.readdirSync(runsDir)) {
    if (!file.endsWith(".json")) continue;
    const id = file.slice(0, -".json".length);
    runsByLoop[id] = readJson<RunRecord[]>(path.join(runsDir, file));
  }
  return { mode: "sample", loops, runsByLoop, oneOffs, summary };
}
