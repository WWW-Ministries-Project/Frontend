import axios from "/src/axiosInstance";
import { baseUrl } from "/src/pages/Authentication/utils/helpers";





//Axios calls
export async function deleteData(path, id) {
  axios.delete(`${baseUrl}/${path}`, { data: { id } }).then(() => {
  })
}