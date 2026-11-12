import Link from "next/link";
import { GITHUB_URL } from "./HomeMain";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>Looper is a project by Rex St. John.</span>
      <span className="footer-links">
        <Link href="/">Looper home</Link>
        <Link href="/spec">Spec format</Link>
        <a href={GITHUB_URL}>GitHub</a>
        <Link href="/llms.txt">llms.txt</Link>
      </span>
    </footer>
  );
}
