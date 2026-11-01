import type { RunStatus } from "./types";

export type BlockReason = "latest_failed" | "two_failed" | "dependency" | null;

const DEPENDENCY_RESULTS = new Set([
  "expired_login",
  "missing_key",
  "budget_hit",
  "dependency_failed",
]);

export function isDependencyResult(result: string | null | undefined): boolean {
  if (!result) return false;
  return DEPENDENCY_RESULTS.has(result);
}

/**
 * Blocked when the latest run failed, a dependency check failed
 * (expired login, missing key, budget hit), or 2 runs in a row failed.
 * `runStatuses` is newest first.
 */
export function blockedReason(input: {
  runStatuses: RunStatus[];
  dependencyFailed?: boolean;
  result?: string | null;
}): BlockReason {
  if (input.dependencyFailed || isDependencyResult(input.result)) return "dependency";
  const [latest, previous] = input.runStatuses;
  const latestFailed = latest === "failed" || input.result === "failed";
  const previousFailed = previous === "failed";
  if (latestFailed && previousFailed) return "two_failed";
  if (latestFailed) return "latest_failed";
  return null;
}

export function isBlocked(input: {
  runStatuses: RunStatus[];
  dependencyFailed?: boolean;
  result?: string | null;
}): boolean {
  return blockedReason(input) !== null;
}
