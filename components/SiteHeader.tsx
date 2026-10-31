import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header data-testid="site-header" className="site-header">
      <Link href="/" className="brand">
        <Logo />
        <span>Looper</span>
      </Link>
      <nav className="nav">
        <Link href="/spec">Spec</Link>
        <Link href="/looper" className="btn btn-primary">
          Open loops
        </Link>
      </nav>
    </header>
  );
}
