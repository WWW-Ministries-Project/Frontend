import { routes, type AppRoute } from "@/routes/appRoutes";
import { useNavHistoryStore } from "@/store/useNavHistoryStore";
import { useCallback, useEffect, useMemo } from "react";
import {
  matchRoutes,
  type RouteObject,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";

/**
 * Records every in-app navigation so `useBackNavigation` knows where the user
 * came from. Mount once inside the router.
 */
export const NavHistoryTracker = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const record = useNavHistoryStore((state) => state.record);

  useEffect(() => {
    record(
      { key: location.key, path: `${location.pathname}${location.search}` },
      navigationType
    );
    // A history entry is identified by its key; pathname/search follow it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, navigationType, record]);

  return null;
};

const topSegment = (path: string) => path.split("/")[1] ?? "";

/**
 * Name of the page at `path`, for "Back to …" labels: the deepest matched
 * route with a `backLabel`, else the deepest navigation page (`sideTab`).
 */
const pageLabel = (routes: AppRoute[], path: string): string | undefined => {
  const pathname = path.split("?")[0];
  const matches = matchRoutes(routes as RouteObject[], pathname) ?? [];
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const route = matches[i].route as AppRoute;
    if (route.backLabel) return route.backLabel;
    if (route.sideTab) return route.name;
  }
  return undefined;
};

/**
 * Back navigation that returns to wherever the user came from. When there is
 * no earlier in-app page (deep link, new tab, notification) it goes to
 * `fallbackPath` instead.
 *
 * `label` names the page `goBack` leads to, for "Back to {label}" copy.
 */
export const useBackNavigation = (fallbackPath: string, fallbackLabel?: string) => {
  const navigate = useNavigate();
  const location = useLocation();
  const entries = useNavHistoryStore((state) => state.entries);

  const previous = useMemo(() => {
    const index = entries.findIndex((entry) => entry.key === location.key);
    const candidate = index > 0 ? entries[index - 1] : undefined;
    // Only step back within the same area (admin `/home` vs member pages),
    // never out to login or a public page.
    return candidate && topSegment(candidate.path) === topSegment(location.pathname)
      ? candidate
      : undefined;
  }, [entries, location.key, location.pathname]);

  const goBack = useCallback(() => {
    if (previous) navigate(-1);
    else navigate(fallbackPath, { replace: true });
  }, [previous, navigate, fallbackPath]);

  const label = useMemo(() => {
    const target = previous?.path ?? fallbackPath;
    return pageLabel(routes, target) || fallbackLabel || "previous page";
  }, [previous, fallbackPath, fallbackLabel]);

  return { goBack, label, hasHistory: Boolean(previous) };
};

