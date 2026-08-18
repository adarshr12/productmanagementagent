import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { AssistantChat } from "@/components/AssistantChat";
import { SplineScene } from "@/components/ui/splite";
import { SplineErrorBoundary } from "@/components/ui/spline-error-boundary";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";

export const metadata: Metadata = {
  title: "Ask the AI product assistant",
  description:
    "Chat with an AI product-management expert about PM roles, frameworks, and career moves.",
};

export default function AssistantPage() {
  return (
    <div className="flex h-screen flex-col">
      <SiteNav />
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <AssistantChat />
        </div>

        {/* Decorative panel filling the otherwise-empty space beside the
            chat on wide screens. Hidden below lg — there's no room for it
            next to the chat on mobile/tablet, and it's purely decorative. */}
        <div className="hidden w-[380px] shrink-0 border-l border-line p-4 lg:block xl:w-[440px]">
          <Card className="relative h-full w-full overflow-hidden bg-[#0a0e1a] text-white">
            <Spotlight className="-top-40 left-0 md:-top-20 md:left-40" />

            {/* Background layer: the 3D scene, full-bleed behind the text. */}
            <div className="absolute inset-0 z-0">
              <SplineErrorBoundary
                fallback={
                  <div className="flex h-full w-full items-center justify-center p-6 text-center text-xs text-neutral-500">
                    3D scene unavailable right now.
                  </div>
                }
              >
                <SplineScene
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="h-full w-full"
                />
              </SplineErrorBoundary>
            </div>

            {/* Foreground layer: text, anchored to the bottom over the scene. */}
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/40 to-transparent p-6">
              <h2 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-2xl font-bold text-transparent">
                Your mentor is listening
              </h2>
              <p className="mt-2 text-sm text-neutral-300">
                Ask about a role, a framework, or a decision you&apos;re
                stuck on — the same mentor that builds your roadmap.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
