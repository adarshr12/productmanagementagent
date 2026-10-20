"use client";

import React from "react";

export interface RobotAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBadge?: boolean;
}

export function RobotAvatar({
  size = "md",
  className = "",
  showBadge = true,
}: RobotAvatarProps) {
  // Uses the app's original animation bot character
  const sizeStyles = {
    sm: "h-8 w-8 p-1",
    md: "h-10 w-10 p-1.5",
    lg: "h-12 w-12 p-2",
    xl: "h-14 w-14 p-2.5",
  };

  const badgeStyles = {
    sm: "h-2.5 w-2.5 -top-0.5 -right-0.5 ring-1.5 ring-white",
    md: "h-3 w-3 top-0 right-0 ring-2 ring-white",
    lg: "h-3.5 w-3.5 top-0 right-0 ring-2 ring-white",
    xl: "h-4 w-4 top-0.5 right-0.5 ring-2 ring-white",
  };

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      <div
        className={`${sizeStyles[size]} rounded-full border border-slate-200 bg-white shadow-xs flex items-center justify-center overflow-hidden`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/animations/animation-bot-poster.svg"
          alt="Product Mentor"
          className="h-full w-full object-contain"
        />
      </div>
      {showBadge && (
        <span
          className={`absolute ${badgeStyles[size]} rounded-full bg-[#10b981] shadow-xs`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
