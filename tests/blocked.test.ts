import { describe, expect, it } from "vitest";
import { blockedReason, isBlocked } from "@/lib/blocked";

describe("blocked rules", () => {
  it("blocks when the latest run failed", () => {
    expect(blockedReason({ runStatuses: ["failed", "ok"] })).toBe("latest_failed");
    expect(isBlocked({ runStatuses: ["failed"] })).toBe(true);
  });

  it("blocks when two runs in a row failed", () => {
    expect(blockedReason({ runStatuses: ["failed", "failed", "ok"] })).toBe("two_failed");
  });

  it("blocks when a dependency check failed", () => {
    expect(blockedReason({ runStatuses: ["ok"], dependencyFailed: true })).toBe("dependency");
    expect(blockedReason({ runStatuses: [], result: "expired_login" })).toBe("dependency");
    expect(blockedReason({ runStatuses: ["ok"], result: "missing_key" })).toBe("dependency");
    expect(blockedReason({ runStatuses: ["ok"], result: "budget_hit" })).toBe("dependency");
  });

  it("does not block a healthy or reverted run", () => {
    expect(isBlocked({ runStatuses: ["ok", "ok"] })).toBe(false);
    expect(isBlocked({ runStatuses: ["reverted", "ok"] })).toBe(false);
    expect(isBlocked({ runStatuses: [], result: "ok" })).toBe(false);
  });
});
