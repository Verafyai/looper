import type { Dataset } from "./types";
import { loadPrivate } from "./private";
import { loadSample } from "./sample";

export function dataMode(env: Record<string, string | undefined> = process.env): "sample" | "private" {
  return env.LOOPER_DATA_MODE === "private" ? "private" : "sample";
}

export function loadDataset(env: Record<string, string | undefined> = process.env, root = process.cwd()): Dataset {
  if (dataMode(env) === "private") {
    return loadPrivate(env.LOOPER_DATA_DIR ?? "");
  }
  return loadSample(root);
}
