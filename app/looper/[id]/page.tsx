import { notFound } from "next/navigation";
import { LoopPage } from "@/components/LoopPage";
import { getDataset } from "@/lib/dataset";

export default async function LoopRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getDataset();
  const loop = data.loops.find((item) => item.id === id);
  if (!loop) notFound();
  return <LoopPage loop={loop} runs={data.runsByLoop[id] ?? []} />;
}
