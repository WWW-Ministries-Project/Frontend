import { useStore } from "@/store/useStore";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { tableColumns } from "./utils/tableColums";
import { useNavigate } from "react-router-dom";
import api from "@/utils/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import LoaderComponent from "../../Components/reusable/LoaderComponent";
import ErrorPage from "@/pages/ErrorPage";
const Requisitions = () => {
    const navigate = useNavigate()
    const {data,loading,error} = useFetch(api.fetch.fetchRequisitions,"")

  return (
    <PageOutline>
      <PageHeader title="Requisition" buttonValue="Request item" onClick={()=>navigate('request')} />
     
      {error && <ErrorPage />}
      {loading && <LoaderComponent />}
      {/* @ts-ignore */}
      {!loading && <TableComponent columns={tableColumns} data={data?.data?.data ??[]}  />}
    </PageOutline>
  );
};

export default Requisitions;
