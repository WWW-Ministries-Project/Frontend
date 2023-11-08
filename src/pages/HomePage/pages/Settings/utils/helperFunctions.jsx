export const departmentColumns = [
  {
    header: "Department",
    accessorKey: "name",
  },
  {
    header: "Department Head",
    accessorKey: "department_head",
  },
  {
    header: "Description",
    accessorKey: "description",
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: (info) => (
      <div
        className={
          info.getValue()
            ? "bg-green text-sm h-6 flex items-center justify-center rounded-lg text-center text-white "
            : "bg-neutralGray text-sm h-6 flex items-center justify-center rounded-lg text-center text-lighterBlack"
        }>
        {info.getValue() ? "Active" : "Inactive"}
      </div>)
  },
]

export const accessColumns = [
  {
    header: "Acess Name",
    accessorKey: "name",
  },
  {
    header: "Department",
    accessorKey: "department_head",
  },
  {
    header: "Description",
    accessorKey: "description",
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: (info) => (
      <div
        className={
          info.getValue()
            ? "bg-green text-sm h-6 flex items-center justify-center rounded-lg text-center text-white "
            : "bg-neutralGray text-sm h-6 flex items-center justify-center rounded-lg text-center text-lighterBlack"
        }>
        {info.getValue() ? "Active" : "Inactive"}
      </div>)
  },
]
export const positionsColumns = [
  {
    header: "Position Name",
    accessorKey: "name",
  },
  {
    header: "Department",
    accessorKey: "department_head",
  },
  {
    header: "Description",
    accessorKey: "description",
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: (info) => (
      <div
        className={
          info.getValue()
            ? "bg-green text-sm h-6 flex items-center justify-center rounded-lg text-center text-white "
            : "bg-neutralGray text-sm h-6 flex items-center justify-center rounded-lg text-center text-lighterBlack"
        }>
        {info.getValue() ? "Active" : "Inactive"}
      </div>)
  },
]