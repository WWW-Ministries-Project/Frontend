import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type { RideReport, RideReportStatus } from "@/utils/api/rides/interfaces";
import {
  LoadError,
  Pill,
  RideSkeleton,
  Segmented,
} from "../components/rideUi";
import {
  btnPrimary,
} from "../components/rideClasses";
import { clockLabel, serviceDateLabel } from "../utils/rideHelpers";
import { PhoneLink } from "./AdminRideShared";
import { formatWhen } from "./adminRideFormat";
import { ResolveReportModal } from "./AdminRideModals";

type StatusFilter = RideReportStatus | "ALL";

const DAY_MS = 24 * 60 * 60 * 1000;

/** When the safety team should have called the reporter back by. */
const ContactDeadline = ({ createdAt }: { createdAt: string }) => {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return null;
  const due = created + DAY_MS;
  if (Date.now() > due) return <Pill tone="danger">Over 24 hours old</Pill>;
  return (
    <span className="text-xs text-amber-700">
      Contact by {formatWhen(new Date(due).toISOString())}
    </span>
  );
};

const Person = ({
  label,
  name,
  phone,
}: {
  label: string;
  name: string;
  phone?: string | null;
}) => (
  <div className="flex min-w-0 flex-col">
    <p className="text-xs text-mainGray">{label}</p>
    <p className="text-sm font-medium text-primary">{name}</p>
    {phone !== undefined ? <PhoneLink phone={phone} /> : null}
  </div>
);

const ReportCard = ({
  report,
  onResolve,
}: {
  report: RideReport;
  onResolve: () => void;
}) => {
  const open = report.status === "OPEN";
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-lightGray bg-white p-4 tablet:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-primary">{report.reason}</h2>
        <Pill tone={open ? "warning" : "success"}>{open ? "Open" : "Resolved"}</Pill>
        {report.blocked ? <Pill tone="danger">Blocked</Pill> : null}
        <span className="ml-auto text-xs text-mainGray">
          {formatWhen(report.created_at)}
        </span>
      </div>
      {open ? <ContactDeadline createdAt={report.created_at} /> : null}

      <p className="whitespace-pre-line break-words rounded-lg bg-inputBackground px-4 py-3 text-sm text-gray-700">
        {report.details ? `“${report.details}”` : "No details given."}
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
        <Person
          label="Reported by"
          name={report.reporter.name}
          phone={report.reporter.phone}
        />
        {report.reported_user ? (
          <Person
            label="About"
            name={report.reported_user.name}
            phone={report.reported_user.phone}
          />
        ) : (
          <Person label="About" name="Not named" />
        )}
        <Person
          label="Ride"
          name={
            report.offer
              ? `${report.offer.area} → Church · ${serviceDateLabel(report.offer.service_date)} · ${clockLabel(report.offer.depart_time)}`
              : "No longer available"
          }
        />
      </div>

      {open ? (
        <div className="flex justify-end border-t border-gray-200 pt-3">
          <button type="button" onClick={onResolve} className={btnPrimary}>
            Resolve
          </button>
        </div>
      ) : (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-mainGray">
            Resolved
            {report.resolver ? ` by ${report.resolver.name}` : ""}
            {report.resolved_at ? ` · ${formatWhen(report.resolved_at)}` : ""}
          </p>
          <p className="whitespace-pre-line break-words text-sm text-gray-700">
            {report.resolution_note || "No note."}
          </p>
        </div>
      )}
    </li>
  );
};

interface RideReportsPanelProps {
  /** Open reports overall, for the "Open (n)" filter. */
  openCount: number | null;
  /** Keeps the page's "Safety reports" tab count in step. */
  onOpenReports: (count: number) => void;
}

/** Safety concerns members report from a ride, for the safety team. */
export const RideReportsPanel = ({
  openCount,
  onOpenReports,
}: RideReportsPanelProps) => {
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

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="max-w-[640px] text-sm text-primaryGray">
          Members are told their report reaches the safety team within 24
          hours. Call the member, act on it, then resolve with a note.
        </p>
        <Segmented
          label="Report status"
          value={status}
          onChange={setStatus}
          options={[
            {
              value: "OPEN",
              label: openCount !== null ? `Open (${openCount})` : "Open",
            },
            { value: "RESOLVED", label: "Resolved" },
            { value: "ALL", label: "All" },
          ]}
        />
      </div>

      {failed ? (
        <LoadError message="Couldn't load safety reports." onRetry={load} />
      ) : loading && !reports.length ? (
        <RideSkeleton rows={2} className="h-56" />
      ) : reports.length === 0 ? (
        <p className="py-8 text-center text-sm text-mainGray">
          {status === "RESOLVED" ? "No resolved reports yet." : "Nothing here. All clear."}
        </p>
      ) : (
        <ul
          className={`grid grid-cols-1 gap-4 ${loading ? "opacity-60" : ""}`}
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
