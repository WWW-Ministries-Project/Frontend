import React from "react";

const BannerWrapper = ({ children }: { children: React.ReactNode }): JSX.Element => {
  return <div className="w-screen bg-primary h-[10rem] text-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
    <div className="h-full flex items-center py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
        {children}
    </div>
    </div>;
};

export default BannerWrapper;
