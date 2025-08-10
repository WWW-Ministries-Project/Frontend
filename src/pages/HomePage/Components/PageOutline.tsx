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
    <>
      <div className="sticky top-0 z-10 pl-3 rounded-t-xl  backdrop-blur-sm">
        <Breadcrumbs items={crumbs || []} />
      </div>
      <section
        role="main"
        className={cn(
          "bg-white w-[calc(100%-2rem)] rounded-xl min-h-[calc(100vh-9rem)] drop-shadow flex flex-col gap-4 mx-auto p-8",
          className
        )}
      >
        {children}
      </section>
    </>
  );
};

export default PageOutline;
