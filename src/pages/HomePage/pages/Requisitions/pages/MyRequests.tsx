import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { decodeToken } from "@/utils/helperFunctions";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tableColumns } from "../utils/tableColums";
const MyRequisitions = () => {
  const navigate = useNavigate();
  const { id } = decodeToken();
  const { data, loading, error } = useFetch(api.fetch.fetchMyRequests, { id });
  const { setRequests, requests } = useStore();

  useEffect(() => {
    setRequests(data?.data?.data);
  }, [data]);

  return (
    <div className="p-4">
      <PageOutline>
        <PageHeader
          title="My Requisitions"
          buttonValue="Request item"
          onClick={() => navigate("/home/requests/request")}
        />

        {loading && <LoaderComponent />}
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
