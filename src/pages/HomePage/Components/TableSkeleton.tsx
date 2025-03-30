import React from "react";

const SkeletonLoader = () => {
  return (
    <table className="w-full rounded-xl">
      <thead>
        <tr className="text-center text-mainGray font-thin py-4 bg-lightGray">
            {Array(5).fill(null).map((_, index) => (
              <th key={index} className="py-4 px-2 text-left">
                <div className="h-4 bg-lightGray rounded animate-pulse w-24"></div>
              </th>
            ))}
        </tr>
      </thead>
      <tbody className="bg-white">
        {Array(5).fill(null).map((_, index) => (
          <tr key={index} className="border-b-2 border-[#EBEFF2] h-20 text-dark900 leading-6 hover:bg-[#f8f9f999]">
            {Array(5).fill(null).map((_, index) => (
              <td key={index} className="px-1">
                <div className="h-4 bg-lightGray rounded animate-pulse w-full"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SkeletonLoader;
