import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { tableColumns } from "../utils/tableColums";
import { useNavigate } from "react-router-dom";
import api from "@/utils/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { decodeToken } from "@/utils/helperFunctions";
const MyRequisitions = () => {
  const navigate = useNavigate();
  const { id } = decodeToken();
  const { data, loading, error } = useFetch(api.fetch.fetchMyRequests, { id });
  const { setRequests, requests } = useStore();

  useEffect(() => {
    setRequests(data?.data?.data);
  }, [data]);

  return (
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
  );
};

export default MyRequisitions;
