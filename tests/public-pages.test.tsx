import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeMain } from "@/components/HomeMain";
import { SpecFormat } from "@/components/SpecFormat";
import { loadSample } from "@/lib/sample";

const banned = /\u2013|\u2014|rexstjohn/i;

describe("public pages", () => {
  const home = renderToStaticMarkup(<HomeMain data={loadSample()} />);
  const spec = renderToStaticMarkup(<SpecFormat />);

  it("renders three product visuals, each with a sample label", () => {
    for (const name of ["dashboard", "loop", "specgoals"]) {
      const start = home.indexOf(`data-product-visual="${name}"`);
      expect(start).toBeGreaterThan(-1);
      const next = home.indexOf("data-product-visual=", start + 10);
      const slice = home.slice(start, next === -1 ? undefined : next);
      expect(slice).toContain('data-testid="sample-label"');
      expect(slice).toContain("Sample data");
    }
    expect(home.match(/data-testid="sample-label"/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("shows blocked red and needs-input amber in the dashboard visual", () => {
    expect(home).toContain('data-tile="blocked"');
    expect(home).toContain('data-tile="needs-input"');
    expect(home).toContain('data-status="blocked"');
    expect(home).toContain('data-status="input"');
  });

  it("has no em dashes, en dashes, or the personal site domain", () => {
    expect(home).not.toMatch(banned);
    expect(spec).not.toMatch(banned);
    const specText = spec.replace(/<[^>]+>/g, "\n");
    expect(specText).not.toMatch(/(^|\n)\s*#{1,4} |\*\*/);
    expect(spec.match(/<h2|<h3/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
