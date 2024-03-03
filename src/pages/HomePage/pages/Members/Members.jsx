import { useOutletContext } from "react-router-dom";
import Button from "../../../../components/Button";
import SearchBar from "../../../../components/SearchBar";
import TableComponent from "../../Components/reusable/TableComponent";  
import { useState } from "react";
import { membersColumns } from "../../utils/helperFunctions";

function Members() {
  const { setDisplayForm,members } = useOutletContext();
  
  const [filterMembers, setFilterMembers] = useState("");

  const columns = membersColumns;
  const handleSearchChange = (e) => {
    setFilterMembers(e.target.value);
  };

  const handleClick = () => {
    setDisplayForm(true);
  };

  return (
    <>
      <main className="h-full">
        <section className="bg-white h-40 grid grid-cols-4 items-center">
          <div className="border-r border-[#EEF2F4] p-2 justify-items-start">
        <p className="P900 dark900">{members.length}</p>
            <p className="P200 text-gray">Registers Church Members</p>
          </div>
          <div className="border-r border-[#EEF2F4] p-2 justify-items-start">
            <p className="P900 dark900">_</p>
            <p className="P200 text-gray">Partners</p>
          </div>
          <div className="border-r border-[#EEF2F4] p-2 justify-items-start">
            <p className="P900 dark900">-</p>
            <p className="P200 text-gray">Females</p>
          </div>
          <div className=" p-2 justify-items-start">
            <p className="P900 dark900">-</p>
            <p className="P200 text-gray">Males</p>
          </div>
        </section>
        <section className="mt-6 bg-white p-7 ">
          <div className="flex justify-between items-center mb-5">
            <div className="flex justify-start gap-2 items-center  w-2/3">
              <SearchBar
                className="w-[40.9%] h-10"
                placeholder="Search members here..."
                value={filterMembers}
                onChange={handleSearchChange}
                id="searchMembers"
              />
              {/* <select
                name="filter"
                id="filter"
                placeholder="Filter"
                className="h-10 bg-white rounded-md p-1 opacity-50 border border-[#f2f2f2]">
                <option value="">Filter by</option>
                <option value="Name">Name</option>
                <option value="Department">Department</option>
                <option value="Date">Date created</option>
              </select> */}
              {/* <select name="filter" id="filter" placeholder="Filter" className="h-10 bg-white rounded-md p-1 opacity-50 border border-[#f2f2f2]">
                <option value="">Filter by</option>
                <option value="Name">Name</option>
                <option value="Department">Department</option>
                <option value="Date">Date created</option>
             </select> */}
            </div>
            <div>
              <Button
                value="Add member"
                className={" text-white h-10 p-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 transition duration-300 hover:bg-gradient-to-l hover:scale-105"}
                onClick={handleClick}
              />
            </div>
          </div>
          {/* <TableComponent /> */}
          <div>
            <TableComponent
              columns={columns}
              data={members}
              filter={filterMembers}
              setFilter={setFilterMembers}
            />
          </div>
        </section>
      </main>
    </>
  );
}

export default Members;
