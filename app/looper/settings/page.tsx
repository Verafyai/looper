import { dataMode } from "@/lib/adapter";

export default function SettingsPage() {
  const mode = dataMode();
  return (
    <div>
      <p className="page-kicker">LOOPER</p>
      <h1 className="page-title">Settings</h1>
      <section data-panel="" className="spec-block">
        <h2>Data mode</h2>
        <p>This server is running in {mode} mode.</p>
        <p>Leave LOOPER_DATA_MODE unset, or set it to sample, to read the committed fixtures.</p>
        <p>Set LOOPER_DATA_MODE to private and LOOPER_DATA_DIR to a folder of loop files to read that folder instead.</p>
      </section>
    </div>
  );
}
