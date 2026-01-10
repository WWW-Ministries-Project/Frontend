import { ReactNode } from "react";

import { cn } from "@/utils/cn";
import { BreadcrumbItemType, Breadcrumbs } from "./BreadCrumb";

interface PageOutlineProps {
  children: ReactNode;
  className?: string;
  crumbs?: BreadcrumbItemType[];
}

const PageOutline = ({
  children,
  className,
  crumbs,
}: PageOutlineProps): JSX.Element => {
  return (
    <div className="flex flex-col flex-1 min-h-0 ">
  <div className="sticky top-0 z-10  rounded-t-xl backdrop-blur-sm flex-shrink-0">
    {/* <Breadcrumbs items={crumbs || []} /> */}
  </div>
  <section
  role="main"
  className={cn(
    "bg-white w-full rounded-xl  flex flex-col mx-autooverflow-y-auto px-4",
    className
  )}
>
  {children}
</section>
</div>
  );
};

export default PageOutline;
