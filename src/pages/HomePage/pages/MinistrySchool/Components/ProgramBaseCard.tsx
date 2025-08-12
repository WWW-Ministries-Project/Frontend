// ProgramsCardBase.tsx
import CardWrappers from "@/Wrappers/CardWrapper";
import { Badge } from "@/components/Badge";
import { formatDate } from "@/utils/helperFunctions";
import { ProgramResponse } from "@/utils/api/ministrySchool/interfaces";

interface Cohort {
  id: number;
  name: string;
  startDate: string;
  status: string;
}

interface Program {
  id: number;
  title: string;
  description: string;
  eligibility: "Members" | "Non_Members" | "Both";
  topics: { name: string; id: string }[];
  cohorts: Cohort[];
}

interface ProgramsCardBaseProps {
  program: Partial<ProgramResponse>;
  cohorts?: Cohort[];
  applyCard?: boolean;
  children?: React.ReactNode;
}

const getEligibilityBadge = (eligibility: Program["eligibility"]): JSX.Element => {
  switch (eligibility) {
    case "Members":
      return <Badge>Members Only</Badge>;
    case "Non_Members":
      return <Badge className="bg-red-50 text-xs text-red-700 border border-red-200">Non Members Only</Badge>;
    case "Both":
      return <Badge className="bg-green/10 text-xs text-green-700 border border-green/50">Open to All</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

export const ProgramBaseCard = ({ program, cohorts = [], applyCard = false, children }: ProgramsCardBaseProps) => {
  return (
    <CardWrappers className="border border-lightGray rounded-lg p-6 flex flex-col gap-4 text-primary transition-shadow hover:shadow-md">
      <div>
        <div className="flex justify-between items-start gap-3">
          <h3 className={`${applyCard ? "text-2xl font-semibold" : "text-lg font-semibold line-clamp-2"}`}>{program.title}</h3>
        </div>
        <p className="text-sm text-gray-700 line-clamp-3">{program.description}</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Topics</h4>
        <div className="flex flex-wrap gap-2">
          {program?.topics?.map((topic, index) => (
            <span key={index} className="text-xs py-1 px-3 border border-lightGray rounded-full bg-lightGray/30">
              {topic.name}
            </span>
          ))}
        </div>
      </div>

      {!applyCard && <hr className="border-gray-100" />}

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Cohorts</h4>
        <div className="space-y-2">
          {cohorts.length > 0 ? (
            cohorts.map((cohort) => (
              <div key={cohort.id} className="border border-lightGray rounded-lg p-3 transition-colors hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{cohort.name}</div>
                    <div className="text-xs text-gray-600">{formatDate(cohort.startDate)}</div>
                  </div>
                  <Badge
                    className={`text-xs px-3 py-1 ${
                      cohort.status === "Active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : cohort.status === "Completed"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {cohort.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="border border-dashed border-lightGray rounded-lg p-4 text-center text-gray-500 text-sm">
              No cohorts added yet
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow" />
      {!applyCard && <hr className="my-0 w-[calc(100%+32px)] -mx-4 border-t-1 border-gray-100" />}
      {children}
    </CardWrappers>
  );
};
