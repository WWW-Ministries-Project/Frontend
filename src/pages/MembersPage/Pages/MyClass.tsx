import EmptyState from "@/components/EmptyState";
import { useFetch } from "@/CustomHooks/useFetch";
import { TopicAssessment } from "@/pages/HomePage/pages/MinistrySchool/Components/TopicAssessment";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils";

const MyClass = () => {
  const userData = useUserStore((state) => state);
  const user_id = userData.id;

  const { data: studentData, refetch, loading } = useFetch(
    api.fetch.fetchEnrollmentsByUserId,
    { user_id }
  );

  const topics = studentData?.data?.course?.cohort?.program?.topics;

  const hasData = !!studentData?.data?.id;

  return (
    <div>
      <div className="w-screen bg-primary h-[10rem] text-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="h-full flex items-center py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
          <div className="space-y-4">
            {studentData?.data?.course&&<div className="font-bold text-2xl">
              {studentData?.data?.course?.cohort?.program?.title} -{" "}
              {studentData?.data?.course?.cohort?.name}
            </div>}
            <div>
              {studentData?.data?.course?.cohort?.program?.description}
            </div>
            <div className="flex gap-4">
              <div>{studentData?.data?.course?.name}</div>
              <div>{studentData?.data?.course?.facilitator?.name}</div>
            </div>
          </div>
        </div>
      </div>

      <section className="p-4">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : hasData ? (
          <TopicAssessment 
            topics={topics || []} 
            enrollmentId={studentData.data.id}
            editMode={false}
            loading={false}
            onCancel={() => {}}
            onUpdate={(data) => {}}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
           <EmptyState/>
            <p className="text-lg font-medium">No classes found</p>
            <p className=" text-gray-400">
              You are not enrolled in any program yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyClass;
