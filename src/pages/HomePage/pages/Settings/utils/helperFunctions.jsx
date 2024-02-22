import edit from "../../../../../assets/edit.svg";
import deleteIcon from "../../../../../assets/delete.svg";
import axios from "/src/axiosInstance";
import { baseUrl } from "/src/pages/Authentication/utils/helpers";
// export const departmentColumns = [
//   {
//     header: "Department",
//     accessorKey: "name",
//   },
//   {
//     header: "Department Head",
//     accessorKey: "department_head_info",
//     cell: (info) => info.getValue()?.name ?? "N/A"
//   },
//   {
//     header: "Description",
//     accessorKey: "description",
//     cell: (info) => info.getValue() ?? "N/A"
//   },
//   {
//     header: "Actions",
//     accessorKey: "status",
//     cell: ({ row }) => (
//       <div
//         className={
//           "text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center text-white "
//         }>
//         <img src={edit} alt="edit icon" className="cursor-pointer" />
//         <img src={deleteIcon} alt="delete icon" className="cursor-pointer" onClick={() => { deleteDepartment(row.original.id) }} />

//       </div>
//     )
//   },
// ]

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
        <img src={edit} alt="edit icon" className="cursor-pointer" />
        <img src={deleteIcon} alt="delete icon" className="cursor-pointer" />

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
    cell: (info) => info.getValue()?.name ?? "N/A"
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
        <img src={edit} alt="edit icon" className="cursor-pointer" />
        <img src={deleteIcon} alt="delete icon" className="cursor-pointer" />

      </div>)
  },
]

export const accessValues =  {
  "create_Dashboard": false,
  "edit_Dashboard": false,
  "delete_Dashboard": false,
  "view_Dashboard": false,
  "create_Positions": false,
  "edit_Positions": false,
  "delete_Positions": false,
  "view_Positions": false,
  "create_Members": false,
  "edit_Members": false,
  "delete_Members": false,
  "view_Members": false,
  "create_Departments": false,
  "edit_Departments": false,
  "delete_Departments": false,
  "view_Departments": false,
  "create_Access Rights": false,
  "edit_Access Rights": false,
  "delete_Access Rights": false,
  "view_Access Rights": false
}





//Axios calls
export async function deleteData(path, id) {
  axios.delete(`${baseUrl}/${path}`, { data: { id } }).then((res) => {
  })
}

export async function updateData(path, data) {
  return axios.put(`${baseUrl}/${path}`, data).then((res) => {
    return res.data
  }).catch((err) => {
    return err
  })
}