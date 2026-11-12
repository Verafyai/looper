import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { GITHUB_URL, HomeMain, screenshots } from "@/components/HomeMain";
import { SpecFormat } from "@/components/SpecFormat";

const banned = /\u2013|\u2014|rexstjohn/i;

describe("public pages", () => {
  const home = renderToStaticMarkup(<HomeMain />);
  const spec = renderToStaticMarkup(<SpecFormat />);

  it("leads with the headline and sends people to GitHub", () => {
    expect(home).toContain("Manage your agentic processes and workflows, on a schedule, in one dashboard");
    expect(home).toContain(`href="${GITHUB_URL}"`);
    expect(home).toContain("View on GitHub");
    expect(home).not.toContain("Read the spec");
  });

  it("shows every screenshot in one strip, each file present, with a sample data note", () => {
    expect(screenshots.length).toBeGreaterThanOrEqual(5);
    for (const shot of screenshots) {
      expect(home).toContain(`src="/screenshots/${shot.file}"`);
      expect(fs.existsSync(path.join(process.cwd(), "public/screenshots", shot.file))).toBe(true);
    }
    expect(home.match(/class="shot-strip"/g)?.length).toBe(1);
    expect(home).toContain("Screenshots show sample data.");
  });

  it("drops the old sections", () => {
    for (const id of ["bank", "anatomy", "how", "who", "origin", "faq", "next"]) expect(home).not.toContain(`id="${id}"`);
  });

  it("has no em dashes, en dashes, or the personal site domain", () => {
    expect(home).not.toMatch(banned);
    expect(spec).not.toMatch(banned);
    const specText = spec.replace(/<[^>]+>/g, "\n");
    expect(specText).not.toMatch(/(^|\n)\s*#{1,4} |\*\*/);
    expect(spec.match(/<h2|<h3/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
