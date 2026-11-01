import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>Looper is a project by Rex St. John.</span>
      <span className="footer-links">
        <Link href="/">Looper home</Link>
        <Link href="/spec">Spec format</Link>
        <Link href="/llms.txt">llms.txt</Link>
      </span>
    </footer>
  );
}
