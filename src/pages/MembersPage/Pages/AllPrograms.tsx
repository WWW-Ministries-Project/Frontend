import ProgramApply from "@/pages/HomePage/pages/MinistrySchool/pages/ProgramApply";
import BannerWrapper from "../layouts/BannerWrapper";
import exploreprogram from "@/assets/banner/exploreprog.svg";

const AllPrograms = () => {

    return ( 
        <div>
            < BannerWrapper imgSrc={exploreprogram} >
                <div className="space-y-4 w-full">
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