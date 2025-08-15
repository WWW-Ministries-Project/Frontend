import ChurchLogo from "@/components/ChurchLogo";
import { Outlet } from "react-router-dom";
import { Header } from "../HomePage/Components/Header";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useEffect } from "react";
import { changeAuth } from "@/axiosInstance";
import { useStore } from "@/store/useStore";
import { LoaderComponent } from "../HomePage/Components/reusable/LoaderComponent";
import CartDrawer from "../HomePage/pages/MarketPlace/components/cart/CartDrawer";



const MembersPage = () => {
    const store = useStore();
     const { data: eventsData } = useFetch(api.fetch.fetchUpcomingEvents);

     useEffect(() => {
        //  changeAuth(token);
     
         if (eventsData) {
           store.setEvents(eventsData.data);
         }
     
         // eslint-disable-next-line react-hooks/exhaustive-deps
       }, [
         eventsData,
       ]);
    return ( 
        <div className="bg-gray-100 min-h-screen">

            <div className=" py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem] border">
                <Header handleShowNav={()=>{}} />
            </div>
            <div className="  px-[1rem] lg:px-[4rem] xl:px-[8rem] ">
                <Outlet/>
            </div>
            <CartDrawer/>

            <LoaderComponent/>

        </div>
     );
}

export default MembersPage;