import { AppHeader } from "@/components/AppHeader";
import { getDataset } from "@/lib/dataset";

export const dynamic = "force-dynamic";

export default async function LooperLayout({ children }: { children: React.ReactNode }) {
  const data = await getDataset();
  return (
    <>
      <AppHeader />
      <div className="shell">
        <div className="sample-row">
          {data.mode === "sample" ? (
            <p data-testid="sample-label" className="sample-label">
              Sample data
            </p>
          ) : null}
        </div>
        {children}
        <footer className="footer">
          {`Status from the routine snapshot, ${data.summary.snapshotLabel}`}
          <span> · Changes apply at the next edit sync (every 10 min) · </span>
          <button type="button" className="linkish">
            Sign out
          </button>
        </footer>
      </div>
    </>
  );
}
