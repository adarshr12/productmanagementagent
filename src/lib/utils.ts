import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn's standard class-merge helper: lets a component's own defaults be
 * cleanly overridden by a caller's className instead of both applying. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
