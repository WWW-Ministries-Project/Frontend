import edit from "../../../../../assets/edit.svg";
import deleteIcon from "../../../../../assets/delete.svg";
export const departmentColumns = [
  {
    header: "Department",
    accessorKey: "name",
  },
  {
    header: "Department Head",
    accessorKey: "department_head_info",
    cell: (info) => info.getValue()?.name??"N/A"
  },
  {
    header: "Description",
    accessorKey: "description",
    cell: (info) => info.getValue()??"N/A"
  },
  {
    header: "Actions",
    accessorKey: "status",
    cell: () => (
      <div
        className={
           "text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center text-white "
        }>
        <img src={edit} alt="edit icon" className="cursor-pointer"  />
        <img src={deleteIcon} alt="delete icon"  className="cursor-pointer" />

      </div>
      )
  },
]

export const accessColumns = [
  {
    header: "Acess Name",
    accessorKey: "name",
  },
  {
    header: "Department",
    
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
           "text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center text-white "
        }>
        <img src={edit} alt="edit icon" className="cursor-pointer"  />
        <img src={deleteIcon} alt="delete icon"  className="cursor-pointer" />

      </div>
      )
  },
]
export const positionsColumns = [
  {
    header: "Position Name",
    accessorKey: "name",
  },
  {
    header: "Department",
    accessorKey: "department",
    cell: (info) => info.getValue()?.name??"N/A"
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
           "text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center text-white "
        }>
        <img src={edit} alt="edit icon" className="cursor-pointer"  />
        <img src={deleteIcon} alt="delete icon"  className="cursor-pointer" />

      </div>)
  },
]