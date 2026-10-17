import PageOutline from "@/pages/HomePage/Components/PageOutline";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { Link } from "react-router-dom";
import { useSomData, type InstructorRow } from "./somDataContext";
import { formatLabel, somPaths } from "./somUtils";
import { Avatar, Btn, EmptyBlock, PageHeader, Panel, SimpleTable, StatusPill, LoadError } from "./ui";

export const InstructorsPage = () => {
  const { loading, instructors, error, refetch } = useSomData();
  const rows = [...instructors].sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        {error && <LoadError msg={error} onRetry={refetch} />}
        <PageHeader
          title="Instructors"
          subtitle="Who teaches what and how many learners they carry. Assign an instructor when you create or edit a class."
          actions={<Btn to={`${somPaths.dashboard}/instructor-portal`}>Open grading portal</Btn>}
        />
        {loading && !instructors.length ? (
          <SkeletonLoader />
        ) : (
          <Panel>
            <SimpleTable<InstructorRow>
              rows={rows}
              rowKey={(i) => i.id}
              minWidth={820}
              empty={<EmptyBlock msg="No instructors yet. They appear here once assigned to a class." />}
              columns={[
                {
                  key: "n",
                  header: "Instructor",
                  render: (i) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={i.displayName} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{i.displayName}</p>
                        {i.email && <p className="truncate text-xs text-mainGray">{i.email}</p>}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "c",
                  header: "Classes",
                  render: (i) => (
                    <ul className="flex flex-col gap-0.5 text-xs">
                      {i.courses.map((c) => (
                        <li key={c.id}>
                          <Link to={somPaths.class(c.cohort_id, c.id)} className="text-primary hover:underline">
                            {c.cohort_name} · {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ),
                },
                { key: "p", header: "Programs", render: (i) => <span className="text-primaryGray">{i.programs.join(", ")}</span> },
                { key: "l", header: "Learners", className: "text-right", render: (i) => i.learnerCount },
                {
                  key: "f",
                  header: "Teaches",
                  render: (i) => (
                    <div className="flex flex-wrap gap-1">
                      {i.formats.length
                        ? i.formats.map((f) => <StatusPill key={f} status={f} label={formatLabel(f)} />)
                        : <span className="text-mainGray">—</span>}
                    </div>
                  ),
                },
              ]}
            />
          </Panel>
        )}
      </div>
    </PageOutline>
  );
};

export default InstructorsPage;
