const TableData = (accessLevel: "Can View" | "Can Manage" | "Super Admin") => {
  return (
    <td className="px-4 py-2">
      <span
        className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-md ${
          accessLevel === "Can Manage" && "bg-yellow-100 text-yellow-600"
        } ${accessLevel === "Can View" && "bg-blue-100 text-blue-600"} ${
          accessLevel === "Super Admin" && "bg-primaryViolet text-primaryViolet"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full mr-2 ${
            accessLevel === "Can Manage" && "bg-yellow-600"
          } ${accessLevel === "Can View" && "bg-blue-600"} ${
            accessLevel === "Super Admin" && "bg-primaryViolet"
          }`}
        ></span>
        {accessLevel}
      </span>
    </td>
  );
};

export default TableData;
