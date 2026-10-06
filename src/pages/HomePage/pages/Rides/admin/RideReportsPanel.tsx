import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { api } from "@/utils/api/apiCalls";
import type { RideReport, RideReportStatus } from "@/utils/api/rides/interfaces";
import { clockLabel, plural, serviceDateLabel } from "../utils/rideHelpers";
import {
  FilterChips,
  PanelError,
  PanelSkeleton,
  PhoneLink,
  formatWhen,
  outlineButtonClass,
} from "./AdminRideShared";
import { ResolveReportModal } from "./AdminRideModals";
import { RidePill, RideReportStatusBadge } from "./RideStatusBadge";

type StatusFilter = RideReportStatus | "ALL";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "ALL", label: "All" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

interface RideReportsPanelProps {
  /** Keeps the page's "Safety reports" tab badge in step. */
  onOpenReports: (count: number) => void;
}

/** When the safety team should have called the reporter back by. */
const ContactDeadline = ({ createdAt }: { createdAt: string }) => {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return null;
  const due = created + DAY_MS;
  if (Date.now() > due) {
    return <RidePill tone="rose">Over 24 hours old</RidePill>;
  }
  return (
    <span className="text-xs text-amber-800 dark:text-amber-200">
      Contact by {formatWhen(new Date(due).toISOString())}
    </span>
  );
};

const ReportCard = ({
  report,
  onResolve,
}: {
  report: RideReport;
  onResolve: () => void;
}) => {
  const open = report.status === "OPEN";
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-lightGray bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-primary">
          {report.reason}
        </h3>
        {report.blocked ? <RidePill tone="rose">Blocked</RidePill> : null}
        <span className="ml-auto">
          <RideReportStatusBadge status={report.status} />
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-primaryGray">
        <span>Reported {formatWhen(report.created_at)}</span>
        {open ? <ContactDeadline createdAt={report.created_at} /> : null}
      </div>

      {report.details ? (
        <p className="whitespace-pre-line break-words rounded-xl bg-lightGray/30 p-3 text-sm text-primary">
          “{report.details}”
        </p>
      ) : (
        <p className="text-sm text-primaryGray">No details given.</p>
      )}

      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-primaryGray">Reported by</dt>
        <dd className="flex flex-wrap items-center gap-x-3 gap-y-1 text-primary">
          <span className="font-medium">{report.reporter.name}</span>
          <PhoneLink phone={report.reporter.phone} />
        </dd>
        <dt className="text-primaryGray">About</dt>
        <dd className="flex flex-wrap items-center gap-x-3 gap-y-1 text-primary">
          {report.reported_user ? (
            <>
              <span className="font-medium">{report.reported_user.name}</span>
              <PhoneLink phone={report.reported_user.phone} />
            </>
          ) : (
            <span className="text-primaryGray">Unknown member</span>
          )}
        </dd>
        <dt className="text-primaryGray">Ride</dt>
        <dd className="text-primary">
          {report.offer ? (
            <>
              From {report.offer.area} ·{" "}
              {serviceDateLabel(report.offer.service_date)} · sets off{" "}
              {clockLabel(report.offer.depart_time)}
            </>
          ) : (
            <span className="text-primaryGray">Ride no longer available</span>
          )}
        </dd>
      </dl>

      {!open ? (
        <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-sm dark:border-teal-400/30 dark:bg-teal-400/10">
          <p className="text-xs text-primaryGray">
            Resolved
            {report.resolver ? ` by ${report.resolver.name}` : ""}
            {report.resolved_at ? ` · ${formatWhen(report.resolved_at)}` : ""}
          </p>
          {report.resolution_note ? (
            <p className="mt-1 whitespace-pre-line break-words text-primary">
              {report.resolution_note}
            </p>
          ) : (
            <p className="mt-1 text-primaryGray">No resolution note.</p>
          )}
        </div>
      ) : (
        <div className="mt-auto flex justify-end border-t border-lightGray pt-3">
          <button
            type="button"
            className={outlineButtonClass}
            onClick={onResolve}
          >
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            Resolve
          </button>
        </div>
      )}
    </li>
  );
};

/** Safety concerns members report from a ride, for the safety team to follow up. */
export const RideReportsPanel = ({ onOpenReports }: RideReportsPanelProps) => {
  const [status, setStatus] = useState<StatusFilter>("OPEN");
  const [reports, setReports] = useState<RideReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<RideReport | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setFailed(false);
    try {
      const response = await api.fetch.fetchRideReports({ status });
      if (requestId !== requestRef.current) return;
      const rows = Array.isArray(response.data) ? response.data : [];
      setReports(rows);
      if (status === "OPEN") onOpenReports(rows.length);
      else if (status === "ALL")
        onOpenReports(rows.filter((row) => row.status === "OPEN").length);
    } catch {
      if (requestId === requestRef.current) setFailed(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [status, onOpenReports]);

  useEffect(() => {
    load();
  }, [load]);

  const openCount = reports.filter((report) => report.status === "OPEN").length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-primary dark:border-amber-400/30 dark:bg-amber-400/10">
        <ShieldCheckIcon
          className="mt-0.5 h-5 w-5 flex-none text-amber-700 dark:text-amber-200"
          aria-hidden="true"
        />
        <p>
          Members are told their report goes to the church safety team and that
          someone will contact them within 24 hours.{" "}
          <strong>Contact the reporter within 24 hours</strong>, then resolve
          the report with a note of what was done.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Report status"
          value={status}
          options={STATUS_FILTERS}
          onChange={setStatus}
        />
        {!loading && !failed && status !== "RESOLVED" ? (
          <span className="text-sm text-primaryGray">
            {openCount
              ? `${plural(openCount, "open report")} to follow up`
              : "All caught up"}
          </span>
        ) : null}
      </div>

      {failed ? (
        <PanelError
          message="Failed to load safety reports. Please try again."
          onRetry={load}
        />
      ) : loading && !reports.length ? (
        <PanelSkeleton rows={2} rowClassName="h-56" />
      ) : reports.length === 0 ? (
        <EmptyState
          scope="section"
          msg={status === "OPEN" ? "All caught up" : "No reports"}
          description={
            status === "OPEN"
              ? "There are no open safety reports."
              : "No safety reports match this filter."
          }
        />
      ) : (
        <ul
          className={`grid grid-cols-1 gap-4 xl:grid-cols-2 ${loading ? "opacity-60" : ""}`}
          aria-busy={loading}
        >
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onResolve={() => setResolveTarget(report)}
            />
          ))}
        </ul>
      )}

      {resolveTarget ? (
        <ResolveReportModal
          report={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolved={() => {
            setResolveTarget(null);
            load();
          }}
        />
      ) : null}
    </section>
  );
};
