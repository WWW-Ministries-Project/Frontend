import React from "react";
import { Link, useLocation } from "react-router-dom";

type BreadcrumbProps = {
  separator?: string;
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ separator = ">" }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x && !Number(x));

  return (
    <div className="p-2 bg-white sticky top-0 z-10 shadow-md">
      {pathnames.length > 1 ? (
        <nav aria-label="breadcrumb" className="bg-gray-100 px-5 rounded">
          <ol className="flex space-x-2">
            {/* <li className="text-blue-500 hover:underline">
          <Link to="/">Home</Link>
        </li> */}
            {pathnames.map((value, index) => {
              const isLast = index === pathnames.length - 1;
              const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;

              return (
                <React.Fragment key={index}>
                  {index > 0 && <li className="text-gray-500">{separator}</li>}
                  {isLast ? (
                    <li className="text-dark900 text-bold" aria-current="page">
                      {value.replace(/-/g, " ").replace(/_/g, " ").toUpperCase()}
                    </li>
                  ) : (
                    <li className="text-dark900  hover:text-semibold">
                      <Link to={routeTo}>
                        {value.replace(/-/g, " ").replace(/_/g, " ").toUpperCase()}
                      </Link>
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </nav>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Breadcrumb;
