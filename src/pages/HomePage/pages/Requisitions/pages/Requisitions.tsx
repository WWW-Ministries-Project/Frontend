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
import EmptyState from "@/components/EmptyState";
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
  }, [data, setRequests]);

  return (
    <PageOutline>
      <PageHeader
        title="Requisitions"
        buttonValue="Request item"
        onClick={() => navigate("/home/requests/request")}
      />
      {!(loading || error) && (
        (requests ?? []).length === 0 ? (
          <EmptyState
            scope="page"
            msg="No requisitions found"
            description="No requisition requests have been created yet."
          />
        ) : (
          <TableComponent
            columns={tableColumns}
            data={requests ?? []}
            displayedCount={10}
          />
        )
      )}
    </PageOutline>
  );
};

export default Requisitions;
