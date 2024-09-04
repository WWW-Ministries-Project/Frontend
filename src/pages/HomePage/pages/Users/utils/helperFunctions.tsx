import ProfilePicture from "@/components/ProfilePicture";

export const usersColumns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => <div className="flex items-center gap-2 cursor-pointer" onClick={() => { window.location.href = `/home/members/${row.original.id}/info` }}>
        <ProfilePicture
          src={row.original.photo}
          name={row.original.name}
          alt="profile pic"
          className={`h-[38px] w-[38px] rounded-full border ${row.original.is_active ? "border-green" : "border-error"}`}
          textClass="font-great-vibes overflow-hidden opacity-60"
        />{" "}
        {row.original.name}
      </div>,
    },
    {
      header: "Phone number",
      cell: ({row})=>(`${row.original.country_code?row.original.country_code:""} ${row.original.primary_number}`),
    },
    {
      header: "last visited",
      accessorKey: "last_visited",
      cell: (info) => info.getValue() ? info.getValue() + " days ago" : "N/A",
    },
    // {
    //   header: "Created",
    //   accessorKey: "created_at",
    //   cell: (info) => DateTime.fromISO(info.getValue()).toLocaleString(DateTime.DATE_FULL),
    // },
    {
      header: "Visits",
      accessorKey: "visits",
      cell: (info) => info.getValue() ?? "0" + " visits",
      // cell: (info) => info.getValue() ? info.getValue() + " visits" : "N/A",
    },
    {
      header: "Actions",
      // cell: (info) => (
      //   <div
      //     className={
      //       info.getValue()
      //         ? "bg-green text-sm h-6 flex items-center justify-center rounded-lg text-center text-white "
      //         : "bg-neutralGray text-sm h-6 flex items-center justify-center rounded-lg text-center text-lighterBlack"
      //     }>
      //     {info.getValue() ? "Active" : "Inactive"}
      //   </div>
      // ),
      // cell: ({row}) => (
      //   <div>
      //     <button
      //       onClick={() => {
      //         deleteMember(row.original.id);
      //       }}
      //       className="text-sm h-6 flex items-center justify-center rounded-lg text-center text-error ">
      //       Delete
      //     </button>
      //   </div>
      // ),
    },
  ];