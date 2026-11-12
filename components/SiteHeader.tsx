import Link from "next/link";
import { GITHUB_URL } from "./HomeMain";

export function SiteHeader() {
  return (
    <header data-testid="site-header" className="site-header">
      <Link href="/" className="brand" aria-label="Looper home">
        {/* Brand mark is a static SVG, not a content image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/looper.svg" alt="" width="28" height="28" />
        <span>Looper</span>
      </Link>
      <nav className="nav" aria-label="Main">
        <Link href="/spec">Spec format</Link>
        <a href={GITHUB_URL}>GitHub</a>
        <Link href="/looper" className="btn btn-primary">
          Open loops
        </Link>
      </nav>
    </header>
  );
}
