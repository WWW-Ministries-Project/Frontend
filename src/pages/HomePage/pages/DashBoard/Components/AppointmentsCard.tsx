import { relativePath } from "@/utils/const";
import { Appointment } from "@/utils/api/appointment/interfaces";
import { Link } from "react-router-dom";
import { monthShort } from "../utils/homeUtils";

const STATUS: Record<string, [string, string]> = {
  CONFIRMED: ["#DEF7EC", "#03543F"],
  PENDING: ["#FDF6B2", "#723B13"],
  CANCELLED: ["#FDE8E8", "#9B1C1C"],
};
const STATUS_FALLBACK: [string, string] = ["rgb(var(--color-gray-100))", "rgb(var(--color-gray-700))"];

const statusLabel = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

export const AppointmentsCard = ({
  appointments,
  loading,
}: {
  /** Upcoming appointments, soonest first. */
  appointments: Appointment[];
  loading: boolean;
}) => (
  <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold leading-7 text-primary">Appointments</h3>
      <Link to={relativePath.member.appointments} className="text-sm font-semibold text-primary">
        Book
      </Link>
    </div>

    {!loading && appointments.length === 0 && (
      <p className="border-t border-gray-100 pt-3 text-sm text-gray-500">
        No upcoming appointments.
      </p>
    )}

    {appointments.slice(0, 3).map((a, i) => {
      const date = new Date(a.date);
      const valid = !Number.isNaN(date.getTime());
      const status = (a.status || "PENDING").toUpperCase();
      const [bg, fg] = STATUS[status] ?? STATUS_FALLBACK;
      const meta = [a.staffName || a.attendeeName, a.session?.start].filter(Boolean).join(" · ");
      return (
        <div key={a.id || `${a.staffId}-${a.date}-${i}`} className="flex gap-3 border-t border-gray-100 py-3">
          <div className="flex w-10 flex-none flex-col items-center">
            <span className="text-[11px] font-bold text-gray-500">{valid ? monthShort(date) : ""}</span>
            <span className="text-xl font-bold leading-6 text-primary">{valid ? date.getDate() : ""}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-primary">{a.purpose || "General appointment"}</span>
            {meta && <span className="text-[13px] text-gray-600">{meta}</span>}
            <span
              className="mt-1 self-start rounded-md px-2 py-0.5 text-xs font-semibold"
              style={{ background: bg, color: fg }}
            >
              {statusLabel(status)}
            </span>
          </div>
        </div>
      );
    })}
  </section>
);
