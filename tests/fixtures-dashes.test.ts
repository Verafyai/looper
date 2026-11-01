import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const banned = ["\u2014", "\u2013"];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(full));
    else out.push(full);
  }
  return out;
}

describe("sample fixtures", () => {
  it("contain no em or en dashes", () => {
    const files = filesUnder(path.join(process.cwd(), "fixtures"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      for (const dash of banned) {
        expect(text.includes(dash), file).toBe(false);
      }
    }
  });
});
