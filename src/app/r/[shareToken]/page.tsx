import { notFound } from "next/navigation";
import { getRoadmapByToken } from "@/lib/getRoadmap";
import ResultsClient from "./ResultsClient";

// Always fetch fresh so completion state is up to date.
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
      overview={data.roadmap.content || ""}
      initialSteps={data.steps}
    />
  );
}
