import { lazy } from "react";

// Life center pages load on first visit to keep the main bundle under the PWA precache limit.
export const LifeCenterList = lazy(() => import("./LifeCenterList"));
export const LifeCenterDetail = lazy(() => import("./LifeCenterDetail"));
export const LifeCenterAnalytics = lazy(() => import("./LifeCenterAnalytics"));
