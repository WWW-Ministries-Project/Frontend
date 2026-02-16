import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../Components/PageHeader";
import PageOutline from "../../../Components/PageOutline";
import TableComponent from "../../../Components/reusable/TableComponent";
import { tableColumns } from "../utils/tableColums";
import { ApiResponse } from "@/utils/interfaces";
import { Requisition } from "../types/requestInterface";
const Requisitions = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useFetch<ApiResponse<Requisition[]>>(
    api.fetch.fetchRequisitions as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<Requisition[]>>
  );
  const { setRequests, requests } = useStore();

  useEffect(() => {
    setRequests(data?.data ?? []);
  }, [data]);

  return (
    <PageOutline>
      <PageHeader
        title="Requisitions"
        buttonValue="Request item"
        onClick={() => navigate("/home/requests/request")}
      />
      {!(loading || error) && (
        <TableComponent
          columns={tableColumns}
          data={requests ?? []}
          displayedCount={10}
        />
      )}
    </PageOutline>
  );
};

export default Requisitions;
