import CardWrappers from "@/Wrappers/CardWrapper";
import { Badge } from "@/components/Badge";
import {
  COHORT_STATUS,
  CohortType,
  ProgramResponse,
  getCohortStatusLabel,
  normalizeCohortStatus,
} from "@/utils/api/ministrySchool/interfaces";
import { formatDate } from "@/utils/helperFunctions";

interface ProgramsCardBaseProps {
  program: Partial<ProgramResponse>;
  cohorts?: CohortType[];
  applyCard?: boolean;
  children?: React.ReactNode;
}

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-lightGray bg-lightGray/20 px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-primaryGray">{label}</p>
    <p className="text-sm font-semibold text-primary">{value}</p>
  </div>
);

export const ProgramBaseCard = ({
  program,
  cohorts = [],
  applyCard = false,
  children,
}: ProgramsCardBaseProps) => {
  const topics = program.topics ?? [];
  const visibleTopics = topics.slice(0, 4);
  const remainingTopicsCount = Math.max(0, topics.length - visibleTopics.length);
  const title = program.title?.trim() || "Untitled Program";
  const description = program.description?.trim() || "No description provided.";
  const currentCohort = cohorts[0];
  const cohortStatus = normalizeCohortStatus(currentCohort?.status);
  const cohortStatusLabel = getCohortStatusLabel(currentCohort?.status);
  const audience = [
    program.member_required ? "Members" : null,
    program.leader_required ? "Leaders" : null,
    program.ministry_required ? "Workers" : null,
  ].filter(Boolean) as string[];

  const cohortBadgeClass =
    cohortStatus === COHORT_STATUS.ONGOING
      ? "bg-green-50 text-green-700 border-green-200"
      : cohortStatus === COHORT_STATUS.COMPLETED
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <CardWrappers className="group relative flex h-full flex-col gap-4 rounded-xl border border-lightGray bg-white p-5 text-primary transition-shadow hover:shadow-lg">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-primaryGray">
              School of Ministry
            </p>
            <h3
              className={`${
                applyCard ? "text-2xl font-semibold" : "text-lg font-semibold"
              } line-clamp-2`}
              title={title}
            >
              {title}
            </h3>
          </div>
          {currentCohort && (
            <Badge className={`text-xs px-3 py-1 ${cohortBadgeClass}`}>
              {cohortStatusLabel}
            </Badge>
          )}
        </div>
        <p className=" text-sm text-primaryGray line-clamp-3">
          {description}
        </p>
      </div>

      {/* <div className="grid grid-cols-3 gap-2">
        <StatTile label="Topics" value={String(topics.length)} />
        <StatTile label="Cohorts" value={String(program.cohorts?.length ?? cohorts.length)} />
        <StatTile label="Audience" value={audience.length ? String(audience.length) : "All"} />
      </div> */}

      {audience.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {audience.map((segment) => (
            <Badge key={segment} className="bg-primary/10 text-primary border-primary/20 text-xs">
              {segment}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-primaryGray">
            Curriculum
          </h4>
          <span className="text-xs text-primaryGray">{topics.length} topics</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleTopics.map((topic) => (
            <span
              key={topic.id}
              className="rounded-full border border-lightGray bg-lightGray/30 px-3 py-1 text-xs font-medium text-primary"
            >
              {topic.name}
            </span>
          ))}
          {remainingTopicsCount > 0 && (
            <span className="rounded-full border border-lightGray bg-white px-3 py-1 text-xs text-primaryGray">
              +{remainingTopicsCount} more
            </span>
          )}
          {topics.length === 0 && (
            <span className="text-xs text-primaryGray">No topics yet</span>
          )}
        </div>
      </div>

      {currentCohort && (
        <div className="rounded-lg border border-lightGray bg-lightGray/15 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-primaryGray">Current Cohort</p>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-primary">{currentCohort.name}</p>
            <p className="text-xs text-primaryGray">{formatDate(currentCohort.startDate)}</p>
          </div>
        </div>
      )}

      <div className="mt-auto border-t border-lightGray pt-4">{children}</div>
    </CardWrappers>
  );
};
