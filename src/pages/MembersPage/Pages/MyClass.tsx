import { Button } from "@/components";
import EmptyState from "@/components/EmptyState";
import { useFetch } from "@/CustomHooks/useFetch";
import { TopicAssessment } from "@/pages/HomePage/pages/MinistrySchool/Components/TopicAssessment";
import { useUserStore } from "@/store/userStore";
import { api, relativePath } from "@/utils";
import { useNavigate } from "react-router-dom";
import BannerWrapper from "../layouts/BannerWrapper";

const MyClass = () => {
  const userData = useUserStore((state) => state);
  const navigate = useNavigate();
  const user_id = userData.id;

  const { data: enrollmentData, loading } = useFetch(api.fetch.fetchEnrollmentsByUserId, {
    user_id,
  });

  const enrollment = enrollmentData?.data;
  const program = enrollment?.course?.cohort?.program;
  const cohort = enrollment?.course?.cohort;
  const course = enrollment?.course;
  const instructor = enrollment?.course?.facilitator?.name;
  const topics = program?.topics ?? [];

  const hasEnrollment = Boolean(enrollment?.id);

  const goToProgram = () => {
    if (!program?.id) return;
    const path = relativePath.member.schoolOfMinistries.programDetails.replace(
      ":programId",
      String(program.id)
    );
    navigate(path);
  };

  return (
    <div>
      <BannerWrapper>
        <div className="w-full space-y-3">
          <h1 className="text-2xl font-bold">{program?.title ?? "My Class"}</h1>
          <p>{program?.description ?? "Track your class progress and assessments."}</p>
          {course?.name && (
            <div className="flex flex-wrap gap-4 text-sm">
              <span>{course.name}</span>
              {cohort?.name && <span>{cohort.name}</span>}
              {instructor && <span>{instructor}</span>}
            </div>
          )}
        </div>
      </BannerWrapper>

      <section className="p-4 md:p-6">
        {loading ? (
          <div className="rounded-xl border border-lightGray bg-white p-6 text-center text-primaryGray">
            Loading class information...
          </div>
        ) : hasEnrollment ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-lightGray bg-white p-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-primary">Program Progress</h2>
                <div className="text-sm text-primaryGray">
                  <p>
                    <span className="font-medium">Cohort:</span> {cohort?.name}
                  </p>
                  <p>
                    <span className="font-medium">Class:</span> {course?.name}
                  </p>
                  <p>
                    <span className="font-medium">Instructor:</span> {instructor || "Not assigned"}
                  </p>
                </div>
              </div>
              <Button variant="secondary" value="View Program" onClick={goToProgram} />
            </div>

            <TopicAssessment
              topics={topics}
              enrollmentId={enrollment.id}
              editMode={false}
              loading={false}
              onCancel={() => {}}
              onUpdate={() => {}}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-lightGray bg-white py-12 text-primaryGray">
            <EmptyState scope="section" />
            <p className="text-lg font-medium text-primary">No Class Found</p>
            <p>You are not currently enrolled in any School of Ministry class.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyClass;
