import BannerWrapper from "@/Wrappers/BannerWrapper";

const MyLifeCenter = () => {
    return ( 
        <div>
            <BannerWrapper>
                <div className="space-y-4 ">
                    <div className="font-bold text-2xl">
                    [Life Center Name]
                </div>
                <div>
                    [Life Center Description]
                </div>
                <div className="flex gap-4">
                    <div>
                        [Life Center Location]
                    </div>
                    <div>
                        [Life Center Meeting Days]
                    </div>
                </div>
                </div>
            </BannerWrapper>
            Member life center
        </div>
     );
}
 
export default MyLifeCenter;