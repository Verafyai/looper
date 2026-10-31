"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

export function AppHeader() {
  const path = usePathname();
  const onOneOffs = path === "/looper/one-offs";
  const onSettings = path.startsWith("/looper/settings");
  const onLoops = path.startsWith("/looper") && !onOneOffs && !onSettings;

  return (
    <header data-testid="app-header" className="app-header">
      <Link href="/looper" className="brand">
        <Logo />
        <span>Looper</span>
        <span className="brand-by">by DevRadar</span>
      </Link>
      <nav className="nav">
        <Link href="/looper" aria-current={onLoops ? "page" : undefined}>
          Loops
        </Link>
        <Link href="/looper/one-offs" data-testid="nav-oneoffs" aria-current={onOneOffs ? "page" : undefined}>
          One-offs
        </Link>
        <Link href="/looper/settings" aria-current={onSettings ? "page" : undefined}>
          Settings
        </Link>
        <span data-testid="avatar" className="avatar" aria-label="Account JD">
          JD
        </span>
      </nav>
    </header>
  );
}
