import { Dashboard } from "@/components/Dashboard";
import { getDataset } from "@/lib/dataset";
import { summarizeLoops } from "@/lib/status";

export default async function LooperPage() {
  const data = await getDataset();
  return (
    <Dashboard
      loops={data.loops}
      counts={summarizeLoops(data.loops)}
      oneOffCount={data.oneOffs.length}
      runsToday={data.summary.runsToday}
      costWeek={data.summary.costWeek}
      retired={data.mode === "private" ? (data.retired ?? []) : []}
      mode={data.mode}
    />
  );
}
