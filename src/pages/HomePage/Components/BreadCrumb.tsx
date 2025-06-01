import AngleRight from "@/assets/AngleRight";
import React from "react";
import { Link, useLocation } from "react-router-dom";

type BreadcrumbProps = {
  separator?: string;
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ separator = <AngleRight /> }) => {
  const location = useLocation();
  const { pathname } = location;

  const segments = pathname.split("/").filter((x) => x);

  // Build breadcrumb items while combining ID segments with their parents
  const breadcrumbItems: { label: string; path: string }[] = [];
  let pathAccumulator = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isNumeric = !isNaN(Number(segment));
    pathAccumulator += `/${segment}`;

    // Skip numeric segments - we'll handle them with their parent segment
    if (isNumeric) continue;

    // Check if next segment is numeric (an ID)
    const nextSegmentIsNumeric = i + 1 < segments.length && !isNaN(Number(segments[i + 1]));

    // Format label
    let label = decodeURIComponent(segment.replace(/-/g, " ").replace(/_/g, " "));
    
    // If next segment is numeric, combine them
    if (nextSegmentIsNumeric) {
      label = `${label} ${segments[i + 1]}`;
      pathAccumulator += `/${segments[i + 1]}`;
      i++; // Skip the numeric segment in next iteration
    }

    breadcrumbItems.push({ label, path: pathAccumulator });
  }

  return (
    <div className="  py-2 container text-primary rounded-lg z-10 ">
      {breadcrumbItems.length > 1 ? (
        <nav aria-label="breadcrumb" className=" px-5 rounded">
          <ol className="flex space-x-2 items-center">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              return (
                <React.Fragment key={index}>
                  {index > 0 && <li className="text-primary">{separator}</li>}
                  {isLast ? (
                    <li className="text-primary inverted-colors font-bold" aria-current="page">
                      {item.label}
                    </li>
                  ) : (
                    <li className="text-primary hover:text-bold">
                      <div>{item.label}</div>
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </nav>
      ) : null}
    </div>
  );
};

export default Breadcrumb;