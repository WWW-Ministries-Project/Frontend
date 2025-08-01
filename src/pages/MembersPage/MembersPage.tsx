import ChurchLogo from "@/components/ChurchLogo";
import { Outlet } from "react-router-dom";
import { Header } from "../HomePage/Components/Header";


const MembersPage = () => {
    return ( 
        <div className="bg-gray-100 min-h-screen">
            
            <div className=" py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem] border">
                <Header />
            </div>
            <div className="  px-[1rem] lg:px-[4rem] xl:px-[8rem] ">
                <Outlet/>
            </div>
            
        </div>
     );
}
 
export default MembersPage;