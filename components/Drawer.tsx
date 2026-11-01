"use client";

import { useEffect, useRef } from "react";

const focusable = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Drawer({
  testId,
  title,
  onClose,
  children,
}: {
  testId: "drawer-spec" | "drawer-goals";
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    const list = () => Array.from(root.querySelectorAll<HTMLElement>(focusable)).filter((node) => !node.hasAttribute("disabled"));
    const first = list()[0];
    (first ?? root).focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const nodes = list();
      if (nodes.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const start = nodes[0];
      const end = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault();
        end.focus();
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault();
        start.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        ref={ref}
        data-testid={testId}
        data-panel=""
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-head">
          <h2 id={`${testId}-title`}>{title}</h2>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
