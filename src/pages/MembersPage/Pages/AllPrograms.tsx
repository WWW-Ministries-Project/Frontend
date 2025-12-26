import ProgramApply from "@/pages/HomePage/pages/MinistrySchool/pages/ProgramApply";
import BannerWrapper from "../layouts/BannerWrapper";

const AllPrograms = () => {

    return ( 
        <div>
            <BannerWrapper>
                <div className="space-y-4 ">
                    <div className="font-bold text-2xl">
                    School of Ministry
                </div>
                <div>
                    Equipping believers with biblical knowledge and practical skills for effective ministry
                </div>
                
                </div>
            </BannerWrapper>
        <ProgramApply />
        
                

        </div>
     );
}
 
export default AllPrograms;