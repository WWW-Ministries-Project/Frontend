import { ReactNode } from "react";

interface IProps {
  title?: string;
  children: ReactNode;
}
export function MarketLayout(props: IProps) {
  return (
    <div className="w-screen  text-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className=" bg-primary h-[10rem] flex items-center py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
        <div className="font-bold text-2xl">{props.title || "Marketplace"}</div>
      </div>

      <div className="w-full container mx-auto mb-10 pb-10 py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
        {props.children}
      </div>
    </div>
  );
}
