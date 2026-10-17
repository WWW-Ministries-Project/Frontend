import { Navigate, useParams } from "react-router-dom";
import { somPaths } from "./somUtils";

/** Old URLs nested cohorts under programs (`programs/:p/cohort/:c/class/:k/student/:s`). */
export const LegacyCohortRedirect = () => {
  const { cohortId, classId, studentId } = useParams();
  if (!cohortId) return <Navigate to={somPaths.cohorts} replace />;
  if (classId && studentId) return <Navigate to={somPaths.student(cohortId, classId, studentId)} replace />;
  if (classId) return <Navigate to={somPaths.class(cohortId, classId)} replace />;
  return <Navigate to={somPaths.cohort(cohortId)} replace />;
};
