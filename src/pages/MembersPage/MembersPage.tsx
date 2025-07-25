import ChurchLogo from "@/components/ChurchLogo";
import { Outlet } from "react-router-dom";
import { Header } from "../HomePage/Components/Header";


const MembersPage = () => {
    return ( 
        <div className="bg-gray-100 min-h-screen">
            
            <div className=" py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
                <Header />
            </div>
            <Outlet/>
        </div>
     );
}
 
export default MembersPage;