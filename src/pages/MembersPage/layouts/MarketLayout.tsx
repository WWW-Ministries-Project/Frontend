import { ReactNode } from "react";

interface IProps {
  title?: string;
  children: ReactNode;
}
export function MarketLayout(props: IProps) {
  return (
    <div>
      <div className="w-screen bg-primary h-[10rem] text-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="h-full flex items-center py-4 px-[1rem] lg:px-[4rem] xl:px-[8rem]">
          <div className="space-y-4">
            {
              <div className="font-bold text-2xl">
                {props.title || "Marketplace"}
              </div>
            }
          </div>
        </div>
      </div>

      <section>{props.children}</section>
    </div>
  );
}
