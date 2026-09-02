import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { AssistantChat } from "@/components/AssistantChat";
import { MentorPresencePanel } from "@/components/MentorPresencePanel";
import { Spotlight } from "@/components/ui/spotlight";

export const metadata: Metadata = {
  title: "Ask the AI product assistant",
  description:
    "Chat with an AI product-management expert about PM roles, frameworks, and career moves.",
};

export default function AssistantPage() {
  return (
    <div className="chat-gradient-bg flex h-screen flex-col">
      <SiteNav />
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <AssistantChat />
        </div>

        {/* A living presence beside the chat, not a decorative illustration
            — the companion visibly reacts (listening / thinking /
            responding) to the actual conversation next to it, driven by
            the "mentor-presence" events AssistantChat emits. Hidden below
            lg — there's no room for it next to the chat on mobile/tablet.
            No panel background of its own — it sits on the same gradient
            wash as the chat, just separated by a hairline border. */}
        <div className="hidden w-[380px] shrink-0 border-l border-line p-4 lg:block xl:w-[440px]">
          {/* Spotlight forces `overflow: hidden` onto its own DOM parent
              (see ui/spotlight.tsx) — isolated in its own absolutely
              positioned layer so that clip stays local to the decorative
              glow, instead of also clipping the mentor's thought bubble,
              which needs to spill past this column's edge. */}
          <div className="relative h-full w-full text-ink">
            <div className="absolute inset-0">
              <Spotlight className="-top-40 left-0 from-accent-200 via-accent-100 to-transparent md:-top-20 md:left-40" />
            </div>
            <div className="relative z-10 h-full w-full">
              <MentorPresencePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
