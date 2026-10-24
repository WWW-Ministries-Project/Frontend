import { useNavigate } from "react-router-dom";

/** Sermons are not published yet. "Notify me" opens the notification centre,
 *  where new-content notifications land. */
export const RecentSermons = ({ notificationsPath }: { notificationsPath: string }) => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-5">
      <div className="min-w-[200px] flex-1">
        <h3 className="text-lg font-semibold leading-7 text-primary">Recent sermons</h3>
        <p className="text-sm text-gray-500">
          No sermons posted yet. New messages will appear here after each service.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate(notificationsPath)}
        className="min-h-[40px] rounded-lg border border-gray-300 bg-white px-3.5 text-sm font-semibold text-primary hover:bg-gray-50"
      >
        Notify me
      </button>
    </section>
  );
};
