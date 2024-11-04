import { useStore } from "@/store/useStore";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { tableColumns } from "./utils/tableColums";
import { useNavigate } from "react-router-dom";

const Requisitions = () => {
    const users = useStore().members;
    const navigate = useNavigate()
  return (
    <PageOutline>
      <PageHeader title="Requisition" buttonValue="Request item" onClick={()=>navigate('/home/request')} />
      {/* @ts-ignore */}
      <TableComponent columns={tableColumns} data={users}  />
    </PageOutline>
  );
};

export default Requisitions;
