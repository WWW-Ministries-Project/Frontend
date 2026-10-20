import { lazy } from "react";

// Finance pages load on first visit to keep the main bundle under the PWA precache limit.
export const FinanceManager = lazy(() => import("./FinanceManager"));
export const FinanceRecord = lazy(() => import("./FinanceRecord"));
export const FinanceConfiguration = lazy(() => import("./FinanceConfiguration"));
export const GivingOptions = lazy(() => import("./GivingOptions"));
export const GivingContributions = lazy(() => import("./GivingContributions"));
export const Pledges = lazy(() => import("./Pledges"));
export const PledgeDetail = lazy(() => import("./PledgeDetail"));
