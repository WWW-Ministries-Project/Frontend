// import BannerWrapper from "@/Wrappers/BannerWrapper";

const SchoolOfMinistries = () => {
    return ( 
        <div className="w-screen bg-primary h-[10rem] text-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
    <div className="h-full flex items-center py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
                <div className="space-y-4 ">
                    <div className="font-bold text-2xl">
                    [Program Name] - [Cohort Name]
                </div>
                <div>
                    [Program Description]
                </div>
                <div className="flex gap-4">
                    <div>
                        [Class Name]
                    </div>
                    <div>
                        [Name of Instructor]
                    </div>
                </div>
                </div>
            </div>
        </div>
     );
}

export default SchoolOfMinistries;