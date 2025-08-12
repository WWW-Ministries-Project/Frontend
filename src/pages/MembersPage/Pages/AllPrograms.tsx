import ProgramApply from "@/pages/HomePage/pages/MinistrySchool/pages/ProgramApply";

const AllPrograms = () => {

    return ( 
        <div>
            <div className="w-screen bg-primary h-[10rem] text-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
    <div className="h-full flex items-center py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
                <div className="space-y-4 ">
                    <div className="font-bold text-2xl">
                    School of Ministry
                </div>
                <div>
                    Equipping believers with biblical knowledge and practical skills for effective ministry
                </div>
                
                </div>
            </div>
        </div>
        <ProgramApply />        

        </div>
     );
}
 
export default AllPrograms;