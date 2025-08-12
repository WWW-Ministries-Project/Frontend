import AngleRight from "@/assets/AngleRight";
import React from "react";
import { useNavigate } from "react-router-dom";

interface IProps {
  items: BreadcrumbItemType[];
}

export const Breadcrumbs = ({ items }: IProps) => {
  const navigate = useNavigate();
  const handleClick = (link: string | number | (() => void)) => {
    if (typeof link === "string") {
      navigate(link);
    } else if (typeof link === "function") {
      link();
    }
  };

  if (!items) return null;

  return (
    <div className="py-2 container text-primary rounded-lg z-10">
      <nav aria-label="breadcrumb" className="px-5 rounded">
        <ol className="flex space-x-2 items-center">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <li className="text-primary">
                    <AngleRight />
                  </li>
                )}
                {isLast ? (
                  <li
                    className="text-primary inverted-colors font-bold"
                    aria-current="page"
                  >
                    {item.label}
                  </li>
                ) : (
                  <li>
                    {item.link !== undefined ? (
                      <button
                        type="button"
                        className="text-primary hover:font-bold focus:outline-none"
                        onClick={() => handleClick(item.link!)}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export type BreadcrumbItemType = {
  label: string;
  link?: string | number | (() => void);
};