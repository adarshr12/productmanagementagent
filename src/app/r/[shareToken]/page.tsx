import { notFound } from "next/navigation";
import { getRoadmapByToken } from "@/lib/getRoadmap";
import ResultsClient from "./ResultsClient";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: { shareToken: string };
}) {
  const data = await getRoadmapByToken(params.shareToken);
  if (!data) notFound();

  return (
    <ResultsClient
      shareToken={params.shareToken}
      title={data.roadmap.title || "Your Career Roadmap"}
      role={data.roadmap.role || ""}
      overview={data.roadmap.content || ""}
      initialSteps={data.steps}
    />
  );
}
