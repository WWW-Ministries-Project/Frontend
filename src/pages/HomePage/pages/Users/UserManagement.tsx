import Button from "@/components/Button";
import TableComponent from "../../Components/reusable/TableComponent";
import { usersColumns } from "./utils/helperFunctions";
import { useStore } from "@/store/useStore";
const UserManagement = () => {
    const users = useStore().members;
    return (
        <>
            <div className="flex justify-end my-3">
                <Button value="Add User" className='p-2 text-white bg-gradient-to-r from-violet-500 to-fuchsia-500' onClick={() => alert("delete")} />
            </div>
            <section>
                {/* @ts-ignore */}
                <TableComponent columns={usersColumns} data={users} />
            </section>
        </>
    );
}

export default UserManagement;