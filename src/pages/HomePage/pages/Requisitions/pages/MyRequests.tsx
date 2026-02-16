import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { decodeToken } from "@/utils/helperFunctions";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tableColumns } from "../utils/tableColums";
import { ApiResponse } from "@/utils/interfaces";
import { Requisition } from "../types/requestInterface";
const MyRequisitions = () => {
  const navigate = useNavigate();
  const { id } = decodeToken() || {};
  const { data, loading, error } = useFetch<ApiResponse<Requisition[]>>(
    api.fetch.fetchMyRequests as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<Requisition[]>>,
    { id: id ?? "" }
  );
  const { setRequests, requests } = useStore();

  useEffect(() => {
    setRequests(data?.data ?? []);
  }, [data]);

  return (
    <div className="p-4">
      <PageOutline>
        <PageHeader
          title="My Requisitions"
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
    </div>
  );
};

export default MyRequisitions;
