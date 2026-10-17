import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ridePaths } from "../utils/rideHelpers";
import { MembersOnlyNotice } from "./MembersOnlyNotice";

interface RidePageProps {
  title: string;
  /** Shown under the title. */
  intro?: ReactNode;
  /** Sub-pages link back to the hub. */
  backToHub?: boolean;
  /** The backend answered "members only" — show the notice instead. */
  membersOnly?: boolean;
  children: ReactNode;
}

/** Centred column shared by every ride page. */
export const RidePage = ({
  title,
  intro,
  backToHub = false,
  membersOnly = false,
  children,
}: RidePageProps) => (
  <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
    {membersOnly ? (
      <MembersOnlyNotice />
    ) : (
      <>
        <header className="mb-6 flex flex-col gap-1">
          {backToHub ? (
            <Link
              to={ridePaths.hub}
              className="mb-1 inline-flex w-fit items-center gap-1 text-sm text-primaryGray hover:text-primary"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              Ride to church
            </Link>
          ) : null}
          <h1 className="text-2xl font-semibold text-primary">{title}</h1>
          {intro ? <p className="text-sm text-primaryGray">{intro}</p> : null}
        </header>
        <div className="flex flex-col gap-6">{children}</div>
      </>
    )}
  </div>
);

/** Placeholder blocks while a page loads. */
export const RideSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, index) => (
      <div
        key={index}
        className="h-28 animate-pulse rounded-2xl border border-lightGray bg-lightGray/20"
      />
    ))}
  </div>
);

/** A load that failed for a reason other than membership. */
export const RideLoadError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="rounded-2xl border border-error/40 bg-errorBG p-4 text-sm text-error">
    We couldn't load Ride to church.{" "}
    <button type="button" onClick={onRetry} className="font-semibold underline">
      Try again
    </button>
  </div>
);
