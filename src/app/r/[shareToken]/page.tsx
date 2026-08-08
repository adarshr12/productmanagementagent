import { notFound } from "next/navigation";
import { getRoadmapByToken } from "@/lib/getRoadmap";
import ResultsClient from "./ResultsClient";
import SaveBar from "./SaveBar";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: { shareToken: string };
}) {
  const data = await getRoadmapByToken(params.shareToken);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-ink">
    <div className="mx-auto max-w-5xl px-4 pt-6">
      <SaveBar shareToken={params.shareToken} />
      <ResultsClient
        shareToken={params.shareToken}
        title={data.roadmap.title || "Your Career Roadmap"}
        role={data.roadmap.role || ""}
        overview={data.roadmap.content || ""}
        initialSteps={data.steps}
        startContext={data.startContext}
      />
    </div>
    </div>
  );
}
