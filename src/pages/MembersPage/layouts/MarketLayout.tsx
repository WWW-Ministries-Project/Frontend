import { ReactNode } from "react";
import BannerWrapper from "./BannerWrapper";

interface IProps {
  title?: string;
  children: ReactNode;
}
export function MarketLayout(props: IProps) {
  return (
    <div>
      <BannerWrapper>
          <div className="space-y-4">
            {
              <div className="font-bold text-2xl">
                {props.title || "Marketplace"}
              </div>
            }
          </div>
        </BannerWrapper>

      <section>{props.children}</section>
    </div>
  );
}
