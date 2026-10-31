import Link from "next/link";
import { notFound } from "next/navigation";
import { RunPost } from "@/components/RunPost";
import { getDataset } from "@/lib/dataset";

export default async function RunRoute({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const data = await getDataset();
  const loop = data.loops.find((item) => item.id === id);
  const run = (data.runsByLoop[id] ?? []).find((item) => item.n === Number(n));
  if (!loop || !run) notFound();
  return (
    <div>
      <nav data-testid="breadcrumb" className="breadcrumb">
        <Link href="/looper">Loops</Link>
        <span aria-hidden="true"> › </span>
        <Link href={`/looper/${loop.id}`}>{loop.name}</Link>
        <span aria-hidden="true"> › </span>
        <span>Run {run.n}</span>
      </nav>
      <RunPost run={run} loopId={loop.id} />
    </div>
  );
}
