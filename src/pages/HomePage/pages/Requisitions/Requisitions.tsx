import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { tableColumns } from "./utils/tableColums";
import { useNavigate } from "react-router-dom";
import api from "@/utils/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import LoaderComponent from "../../Components/reusable/LoaderComponent";
import { useEffect } from "react";
import { Requisition } from "./types/requestInterface";
import { useStore } from "@/store/useStore";
const Requisitions = () => {
    const navigate = useNavigate()
    const {data,loading,error} = useFetch<{data:{data:Requisition[]}}>(api.fetch.fetchRequisitions,)
const {setRequests, requests} = useStore()

useEffect(()=>{
setRequests(data?.data?.data as Requisition[])
},[data])

  return (
    <PageOutline>
      <PageHeader title="Requisition" buttonValue="Request item" onClick={()=>navigate('my_requests/request')} />
     
      {/* {error && <ErrorPage />} */}
      {loading && <LoaderComponent  />}
      {/* @ts-ignore */}
      {!loading && ! error && <TableComponent columns={tableColumns} data={requests ??[]} displayedCount={10}  />}
    </PageOutline>
  );
};

export default Requisitions;
