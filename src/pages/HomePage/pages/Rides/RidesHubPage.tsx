import {
  FlagIcon,
  HandRaisedIcon,
  LockClosedIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";
import { CarIcon } from "./components/RideIcons";
import { RidePage } from "./components/RidePage";
import { RideStatusPill } from "./components/RideStatusPill";
import { SectionLabel } from "./components/SectionLabel";
import { rideCard, rideCardHover } from "./components/rideStyles";
import { useMyRide } from "./hooks/useMyRide";
import { ridePaths, rideSummary } from "./utils/rideHelpers";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const SAFETY_RULES: Array<{ icon: Icon; title: string; body: string }> = [
  {
    icon: ShieldCheckIcon,
    title: "Members only",
    body: "Only approved church members can offer or request rides.",
  },
  {
    icon: MapPinIcon,
    title: "Areas, never addresses",
    body: "You share a neighbourhood or pickup point, not where you live.",
  },
  {
    icon: LockClosedIcon,
    title: "Details after acceptance",
    body: "Phone and car details unlock only once the driver accepts.",
  },
  {
    icon: FlagIcon,
    title: "Report or block anytime",
    body: "Every ride has a way to reach the church safety team.",
  },
];

const CHOICES: Array<{
  to: string;
  icon: Icon;
  title: string;
  body: string;
  tint: string;
}> = [
  {
    to: ridePaths.offer,
    icon: CarIcon,
    title: "Offer a ride",
    body: "Driving? Fill your empty seats.",
    tint: "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  },
  {
    to: ridePaths.find,
    icon: HandRaisedIcon,
    title: "Find a ride",
    body: "See who's driving from near you.",
    tint: "bg-teal-50 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300",
  },
];

/** /member/rides — Offer or Find, the member's ride if they have one, and
 *  the four safety rules up front. */
const RidesHubPage = () => {
  const { myRide, membersOnly } = useMyRide();
  const summary = rideSummary(myRide);

  return (
    <RidePage
      title="Ride to church"
      intro="Going to church? Share your ride with another member."
      membersOnly={membersOnly}
    >
      {summary ? (
        <Link
          to={ridePaths.mine}
          className="flex items-center gap-3.5 rounded-2xl border border-teal-200 bg-teal-50/60 p-4 transition-colors hover:bg-teal-50 dark:border-teal-400/30 dark:bg-teal-400/10 dark:hover:bg-teal-400/15"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[10px] font-bold tracking-[0.13em] text-teal-700 dark:text-teal-300">
              MY RIDE · SUNDAY
            </span>
            <span className="text-base font-semibold text-primary">
              {summary.title}
            </span>
            <span className="text-xs text-primaryGray">{summary.subtitle}</span>
          </span>
          <RideStatusPill
            label={summary.status.label}
            tone={summary.status.tone}
          />
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {CHOICES.map(({ to, icon: ChoiceIcon, title, body, tint }) => (
          <Link
            key={to}
            to={to}
            className={cn(rideCard, rideCardHover, "flex flex-col gap-3.5 p-4 md:p-5")}
          >
            <span
              className={cn(
                "inline-flex h-12 w-12 items-center justify-center rounded-2xl",
                tint
              )}
            >
              <ChoiceIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-base font-semibold text-primary md:text-lg">
                {title}
              </span>
              <span className="text-xs text-primaryGray md:text-sm">{body}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-2.5" aria-labelledby="ride-safety">
        <SectionLabel id="ride-safety">How it stays safe</SectionLabel>
        <ul className={cn(rideCard, "flex flex-col gap-4 p-4 md:p-5")}>
          {SAFETY_RULES.map(({ icon: RuleIcon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <RuleIcon
                className="mt-0.5 h-5 w-5 flex-none text-teal-600 dark:text-teal-300"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-primary">
                  {title}
                </span>
                <span className="block text-xs text-primaryGray">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </RidePage>
  );
};

export default RidesHubPage;
