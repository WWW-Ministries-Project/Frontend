// ProgramsCard.tsx
import ProgramsCardApplication from "./ProgramsCardApplication";
import ProgramsCardManagement from "./ProgramsCardManagement";
import { ProgramsCardProps } from "./types";

const ProgramsCard = (props: ProgramsCardProps) => {
  return props.applyCard ? <ProgramsCardApplication {...props} /> : <ProgramsCardManagement {...props} />;
};

export default ProgramsCard;

// types.ts
import { ProgramResponse } from "@/utils/api/ministrySchool/interfaces";

export interface Cohort {
  id: number;
  name: string;
  startDate: string;
  status: string;
}

export interface ProgramsCardProps {
  program: Partial<ProgramResponse>;
  cohorts?: Cohort[];
  handleCopyLink?: (programId: number) => void;
  onOpen?: () => void;
  onDelete?: () => void;
  applyCard?: boolean;
}
