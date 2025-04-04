import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../Components/PageHeader";
import PageOutline from "../../../Components/PageOutline";
import LoaderComponent from "../../../Components/reusable/LoaderComponent";
import TableComponent from "../../../Components/reusable/TableComponent";
import { tableColumns } from "../utils/tableColums";
const Requisitions = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(api.fetch.fetchRequisitions);
  const { setRequests, requests } = useStore();

  useEffect(() => {
    setRequests(data?.data?.data);
  }, [data]);

  return (
    <div className="p-4">
      <PageOutline>
        <PageHeader
          title="Requisitions"
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

export default Requisitions;
