// import BannerWrapper from "@/Wrappers/BannerWrapper";

import { useFetch } from "@/CustomHooks/useFetch";
import { TopicAssessment } from "@/pages/HomePage/pages/MinistrySchool/Components/TopicAssessment";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils";

const MyClass = () => {
    const userData = useUserStore((state) => state);
    const user_id = userData.id
    const { data:studentData, refetch } = useFetch(api.fetch.fetchEnrollmentsByUserId, { user_id });
    const topics = studentData?.data.course?.cohort?.program?.topics;
        // console.log("Data", data.data);
        

    return ( 
        <div>
            <div className="w-screen bg-primary h-[10rem] text-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
    <div className="h-full flex items-center py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
                <div className="space-y-4 ">
                    <div className="font-bold text-2xl">
                    {studentData?.data?.course?.cohort?.program?.title} - {studentData?.data?.course?.cohort?.name}
                </div>
                <div>
                    {studentData?.data?.course?.cohort?.program?.description}
                </div>
                <div className="flex gap-4">
                    <div>
                        {studentData?.data?.course?.name}
                    </div>
                    <div>
                        [Name of Instructor]
                    </div>
                </div>
                </div>
            </div>

            
        </div>
        <section className="">
                {studentData?.data.id && (
                    <TopicAssessment
                    topics={topics || []}
                    
                    enrollmentId={studentData?.data.id}
                    
                    />
                )}
            </section>

        </div>
     );
}

export default MyClass;