import { useOutletContext } from "react-router-dom";
import Button from "../../../../components/Button";
import SearchBar from "../../../../components/SearchBar";
import TableComponent from "../../Components/reusable/TableComponent";
import data from "/public/data/MOCK_DATA.json";
import { useState } from "react";
import { DateTime } from "luxon";

function Members() {
  const { setDisplayForm,members } = useOutletContext();
  const columns = [
    {
      header: "Name",
      accessorFn: row => `${row.first_name} ${row.last_name}`,
      
    },
    {
      header: "Phone number",
      accessorKey: "phone_number_1",
    },
    {
      header: "last visited",
      accessorKey: "last_visited",
      cell: (info) => info.getValue() + " days ago",
    },
    {
      header: "Visits",
      accessorKey: "visits",
      cell: (info) => info.getValue() + " visits",
    },
    {
      header: "Created",
      accessorKey: "member_since",
      cell: (info) => DateTime.fromISO(info.getValue()).toLocaleString(DateTime.DATE_FULL),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info) => (
        <div
          className={
            info.getValue()
              ? "bg-green text-sm h-6 flex items-center justify-center rounded-lg text-center text-white "
              : "bg-neutralGray text-sm h-6 flex items-center justify-center rounded-lg text-center text-lighterBlack"
          }>
          {info.getValue() ? "Active" : "Inactive"}
        </div>
      ),
    },
  ];
  const [filter, setFilter] = useState("");

  const handleSearchChange = (e) => {
    setFilter(e.target.value);
  };

  const handleClick = () => {
    setDisplayForm(true);
  };

  return (
    <>
      <main className="h-full">
        <section className="bg-white h-40 grid grid-cols-4 items-center">
          <div className="border-r border-[#EEF2F4] p-2 justify-items-start">
            <p className="P900 dark900">4k</p>
            <p className="P200 text-gray">Registers Church Members</p>
          </div>
          <div className="border-r border-[#EEF2F4] p-2 justify-items-start">
            <p className="P900 dark900">15k</p>
            <p className="P200 text-gray">Partners</p>
          </div>
          <div className="border-r border-[#EEF2F4] p-2 justify-items-start">
            <p className="P900 dark900">3k</p>
            <p className="P200 text-gray">Females</p>
          </div>
          <div className=" p-2 justify-items-start">
            <p className="P900 dark900">3k</p>
            <p className="P200 text-gray">Males</p>
          </div>
        </section>
        <section className="mt-6 bg-white p-7 ">
          <div className="flex justify-between items-center mb-5">
            <div className="flex justify-start gap-2 items-center  w-2/3">
              <SearchBar
                className="w-[40.9%] h-10"
                placeholder="Search members here..."
                value={filter}
                onChange={handleSearchChange}
              />
              <select
                name="filter"
                id="filter"
                placeholder="Filter"
                className="h-10 bg-white rounded-md p-1 opacity-50 border border-[#f2f2f2]">
                <option value="">Filter by</option>
                <option value="Name">Name</option>
                <option value="Department">Department</option>
                <option value="Date">Date created</option>
              </select>
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
                className={" text-white h-10 p-2"}
                onClick={handleClick}
              />
            </div>
          </div>
          {/* <TableComponent /> */}
          <div>
            <TableComponent
              columns={columns}
              data={members}
              filter={filter}
              setFilter={setFilter}
            />
          </div>
        </section>
      </main>
    </>
  );
}

export default Members;
