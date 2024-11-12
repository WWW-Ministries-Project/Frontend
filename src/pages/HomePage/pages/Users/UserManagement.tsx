import Button from "@/components/Button";
import TableComponent from "../../Components/reusable/TableComponent";
import { usersColumns } from "./utils/helperFunctions";
import { useStore } from "@/store/useStore";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
const UserManagement = () => {
    const users = useStore().members;
    return (
        <PageOutline>
            <PageHeader buttonValue="Add User"  onClick={() => alert("delete")}/>
            <section>
                {/* @ts-ignore */}
                <TableComponent columns={usersColumns} data={users} />
            </section>
        </PageOutline>
    );
}

export default UserManagement;