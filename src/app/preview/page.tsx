import { SplineScene } from "@/components/ui/splite";
import { SplineErrorBoundary } from "@/components/ui/spline-error-boundary";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { SiteNav } from "@/components/SiteNav";

// Standalone evaluation page for the Spline 3D-scene component — not linked
// from nav or the main site yet. It's wired up with a generic public demo
// scene (not ProductPath's own), so this exists to check the mechanics work
// before deciding whether/where it belongs on the real site.
export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-paper">
      <SiteNav />
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <p className="tag mb-3">component preview — not on the live site yet</p>
        <h1 className="font-display mb-8 text-2xl font-semibold text-ink">
          Spline 3D scene
        </h1>

        <Card className="relative h-[500px] w-full overflow-hidden bg-[#0a0e1a] text-white">
          <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" />

          <div className="flex h-full flex-col md:flex-row">
            <div className="relative z-10 flex flex-1 flex-col justify-center p-8">
              <h2 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                A mentor who feels alive
              </h2>
              <p className="mt-4 max-w-lg text-neutral-300">
                An interactive 3D scene, wired up here to confirm the
                mechanics work. This placeholder scene isn&apos;t
                ProductPath&apos;s own — swap the `scene` prop for a real
                Spline export before this goes anywhere near the live site.
              </p>
            </div>

            <div className="relative flex-1">
              <SplineErrorBoundary
                fallback={
                  <div className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-neutral-400">
                    3D scene didn&apos;t load (blocked request or offline) —
                    the rest of the page still works.
                  </div>
                }
              >
                <SplineScene
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="h-full w-full"
                />
              </SplineErrorBoundary>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
