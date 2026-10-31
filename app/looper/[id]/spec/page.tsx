import { notFound } from "next/navigation";
import { GoalsPanel } from "@/components/GoalsPanel";
import { SpecPanel } from "@/components/SpecPanel";
import { getDataset } from "@/lib/dataset";

export default async function SpecRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getDataset();
  const loop = data.loops.find((item) => item.id === id);
  if (!loop) notFound();
  return (
    <div>
      <h1 className="page-kicker spec-kicker">{loop.name}</h1>
      <div className="spec-grid split">
        <SpecPanel loop={loop} />
        <GoalsPanel loop={loop} />
      </div>
    </div>
  );
}
