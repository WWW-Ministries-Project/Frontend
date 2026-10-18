import { useFetch } from "@/CustomHooks/useFetch";
import { EmptyBlock, LoadError, PageHeader } from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import { api } from "@/utils/api/apiCalls";
import { shortDate } from "./learnerUtils";

const LearnerAnnouncements = () => {
  const { data, loading, error, refetch } = useFetch(api.fetch.fetchLearnerAnnouncements);
  const announcements = data?.data ?? [];

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title="Announcements"
        subtitle="Messages from your instructors and the School of Ministry office."
      />
      {error && !data ? (
        <LoadError msg="We could not load announcements." onRetry={() => refetch()} />
      ) : !loading && !announcements.length ? (
        <EmptyBlock msg="No announcements yet." />
      ) : (
        announcements.map((a) => (
          <article
            key={a.id}
            className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="font-semibold text-primary">{a.title}</h2>
              <span className="text-xs text-mainGray">{shortDate(a.sentAt)}</span>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-primaryGray">{a.body}</p>
            <p className="text-xs text-mainGray">
              {a.sentByName ?? "School of Ministry office"} ·{" "}
              {a.className ? `${a.programTitle} · ${a.className}` : `${a.programTitle} · ${a.cohortName}`}
            </p>
          </article>
        ))
      )}
    </div>
  );
};

export default LearnerAnnouncements;
