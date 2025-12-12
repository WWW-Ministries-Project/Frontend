import { Children, ReactNode } from "react";

const BannerWrapper = ({children}: {children: ReactNode}) => {
    return ( 
        <div className="w-screen bg-primary h-[10rem] text-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="h-full flex items-center py-4 px-[1rem] lg:px-[8rem] xl:px-[16rem]">
            {children}
        </div>
        </div>
     );
}
 
export default BannerWrapper;