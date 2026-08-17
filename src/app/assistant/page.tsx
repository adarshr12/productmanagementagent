import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { AssistantChat } from "@/components/AssistantChat";

export const metadata: Metadata = {
  title: "Ask the AI product assistant",
  description:
    "Chat with an AI product-management expert about PM roles, frameworks, and career moves.",
};

export default function AssistantPage() {
  return (
    <div className="flex h-screen flex-col">
      <SiteNav />
      <div className="min-h-0 flex-1">
        <AssistantChat />
      </div>
    </div>
  );
}
