import { Outlet } from "react-router-dom";
import BannerWrapper from "../layouts/BannerWrapper";

const Instructor = () => {
    return ( 
        <div>
            <div className="pb-4">
                <BannerWrapper>
                    <div className="space-y-4 w-full">
                        <div className="font-bold text-3xl">Instructor Portal</div>
                        <div>Overview of programs you are instructing.</div>
                    </div>
                </BannerWrapper>
            </div>
            
            <div>
                <Outlet/>
            </div>
        </div>
     );
}
 
export default Instructor;