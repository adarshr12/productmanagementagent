"use client";

import { Component, type ReactNode } from "react";

// SplineScene fetches its 3D scene file client-side from Spline's CDN — a
// blocked/failed request (ad blocker, CDN hiccup, offline) throws inside the
// spline runtime, and without a boundary that unmounts everything above it,
// not just this section.
export class SplineErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
