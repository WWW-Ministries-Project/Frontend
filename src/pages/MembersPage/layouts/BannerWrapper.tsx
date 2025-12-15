import { Children, ReactNode } from "react";

const BannerWrapper = ({children}: {children: ReactNode}) => {
    return ( 
        <div className="w-screen bg-primary h-[10rem] text-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="h-full flex items-center py-4 mx-auto px-4 lg:px-16 xl:px-32 3xl:px-64  max-w-[2000px]">
            {children}
        </div>
        </div>
     );
}
 
export default BannerWrapper;