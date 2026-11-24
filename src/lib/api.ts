export const BASE_PATH =
  process.env.NEXT_PUBLIC_BASE_PATH !== undefined
    ? process.env.NEXT_PUBLIC_BASE_PATH
    : "/productagent";

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!BASE_PATH) return cleanPath;
  if (cleanPath.startsWith(BASE_PATH)) return cleanPath;
  return `${BASE_PATH}${cleanPath}`;
}

export function assetUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!BASE_PATH) return cleanPath;
  if (cleanPath.startsWith(BASE_PATH)) return cleanPath;
  return `${BASE_PATH}${cleanPath}`;
}
