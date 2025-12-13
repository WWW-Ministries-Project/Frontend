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
    <div className="flex flex-col gap-4 flex-1 min-h-0 ">
  <div className="sticky top-0 z-10  rounded-t-xl backdrop-blur-sm flex-shrink-0">
    <Breadcrumbs items={crumbs || []} />
  </div>
  <section
  role="main"
  className={cn(
    "bg-white w-[calc(100%-2rem)] rounded-xl drop-shadow flex flex-col gap-4 mx-auto min-h-[calc(100vh-16vh)] overflow-auto",
    className
  )}
>
  {children}
</section>
</div>
  );
};

export default PageOutline;
