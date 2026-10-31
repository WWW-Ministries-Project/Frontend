export const HOME_ROUTE_BASE = "/home";

export const normalizePath = (path: string) => {
  const trimmed = path.replace(/\/+$/, "");
  if (!trimmed) return "/";
  return trimmed.replace(/\/{2,}/g, "/");
};

export const resolveHomePath = (path: string) => {
  if (!path) return HOME_ROUTE_BASE;
  if (path.startsWith("/")) return normalizePath(path);
  return normalizePath(`${HOME_ROUTE_BASE}/${path}`);
};

export const isPathActive = (pathname: string, path: string) => {
  const normalizedPathname = normalizePath(pathname);
  const normalizedPath = normalizePath(path);
  return (
    normalizedPathname === normalizedPath ||
    normalizedPathname.startsWith(`${normalizedPath}/`)
  );
};

export const joinRelativePaths = (base: string, child?: string) => {
  const normalizedBase = base.replace(/\/+$/, "");
  if (!child) return normalizedBase;
  return `${normalizedBase}/${child.replace(/^\/+/, "")}`;
};
