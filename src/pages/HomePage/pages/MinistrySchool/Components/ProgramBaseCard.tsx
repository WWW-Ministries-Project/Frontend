// ProgramsCardBase.tsx
import CardWrappers from "@/Wrappers/CardWrapper";
import { ProgramResponse } from "@/utils/api/ministrySchool/interfaces";

interface ProgramsCardBaseProps {
  program: Partial<ProgramResponse>;
  applyCard?: boolean;
  children?: React.ReactNode;
}

export const ProgramBaseCard = ({ program, applyCard = false, children }: ProgramsCardBaseProps) => {
  return (
    <CardWrappers className="border border-lightGray rounded-lg p-6 flex flex-col gap-4 text-primary transition-shadow hover:shadow-md">
      <div>
        <div className="flex justify-between items-start gap-3">
          <h3 className={`${applyCard ? "text-2xl font-semibold" : "text-lg font-semibold line-clamp-2"}`}>{program.title}</h3>
        </div>
        <p className="text-sm text-primaryGray line-clamp-3">{program.description}</p>
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

      <div className="flex-grow" />
      {!applyCard && <hr className="my-0 w-[calc(100%+32px)] -mx-4 border-t-1 border-lightGray" />}
      {children}
    </CardWrappers>
  );
};
