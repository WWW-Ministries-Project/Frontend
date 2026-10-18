import { useNavigate } from "react-router-dom";

/** Sermons are not published yet. "Notify me" opens the notification centre,
 *  where new-content notifications land. */
export const RecentSermons = ({ notificationsPath }: { notificationsPath: string }) => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white px-6 py-5">
      <div className="min-w-[200px] flex-1">
        <h3 className="text-lg font-semibold leading-7 text-[#080D2D]">Recent sermons</h3>
        <p className="text-sm text-[#6B7280]">
          No sermons posted yet. New messages will appear here after each service.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate(notificationsPath)}
        className="min-h-[40px] rounded-lg border border-[#D1D5DB] bg-white px-3.5 text-sm font-semibold text-[#080D2D] hover:bg-[#F9FAFB]"
      >
        Notify me
      </button>
    </section>
  );
};
