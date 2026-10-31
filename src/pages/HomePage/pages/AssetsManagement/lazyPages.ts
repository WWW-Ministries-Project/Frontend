import { lazy } from "react";

// Assets pages load on first visit to keep the main bundle under the PWA precache limit.
export const AssetManager = lazy(() => import("./AssetManager"));
export const AssetReconciliation = lazy(() => import("./AssetReconciliation"));
export const AssetCountPage = lazy(() => import("./AssetReconciliation").then((m) => ({ default: m.AssetCountPage })));
export const AssetAnalytics = lazy(() => import("./AssetAnalytics"));
