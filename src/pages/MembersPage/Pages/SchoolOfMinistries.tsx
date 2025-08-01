import BannerWrapper from "@/Wrappers/BannerWrapper";

const SchoolOfMinistries = () => {
    return ( 
        <div>
            <BannerWrapper>
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
            </BannerWrapper>
        </div>
     );
}
 
export default SchoolOfMinistries;