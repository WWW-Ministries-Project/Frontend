import { useState } from "react";
import PropTypes from "prop-types";
function SearchMembersCard({users,...props}) {
  
  const maxNumberShown=6
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(users);

  const handleSearch = (event) => {
    const inputValue = event.target.value;
    setQuery(inputValue);

    // Filter the data based on the query
    const filteredResults = users.filter(item =>
      item.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    setSearchResults(filteredResults);
  };

  const selectUser=(elemId)=>{
    props.handleMembersSelect(elemId)
  }
  return (
    <>
      <div className={"border border-[#F5F5F5] rounded-md p-4 "+props.className}>
      <div className="py-2">
              <label className="relative block">
              <span className="sr-only">Search</span>
              <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                <svg className="h-5 w-5 fill-slate-300" viewBox="0 0 20 20">...</svg>
              </span>
              <input className="placeholder:italic placeholder:text-slate-400 block bg-white w-full border border-slate-300 rounded-md py-2 pl-9 pr-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm" placeholder="Search for anything..." type="text" name="search" value={query} onChange={handleSearch} />
            </label>
              </div>

              <div className="py-2">
                <div className="flex ml-2">

                {props.selectedUsers.slice(0,maxNumberShown).map((elem) => <div className="flex relative" key={elem.id}>
                  <div className="bg-blue-200 w-10 h-10 rounded-full border-4 border-white shadow-md -ml-2 overflow-hidden flex justify-center items-center">
                    {elem.user_info?.photo ? <img src={elem.user_info.photo} alt={elem.name} /> : elem.name[0].toUpperCase()}
                  </div>
                </div>)}

                {props.selectedUsers.length > maxNumberShown && 
                  <div className="bg-slate-50 w-10 h-10 rounded-full border-4 border-white shadow-md -ml-2 z-10 flex justify-center items-center font-normal">+{props.selectedUsers.length-maxNumberShown}</div>
                }
                </div>
              </div>

              <div className="flex flex-col gap-2 py-2 h-80 overflow-y-scroll">
                {searchResults.map((elem) => <div className="flex flex-row gap-3 items-center" key={elem.id}>
                  <input type="checkbox" name="checkbox" value="" className="bg-purple-400" onClick={()=>selectUser(elem.id)} />
                  <div className="bg-blue-200 w-10 h-10 rounded-full overflow-hidden flex justify-center items-center">{elem.user_info?.photo ? <img src={elem.user_info.photo} alt={elem.name} /> : elem.name[0].toUpperCase()}</div>
                  <div>{elem.name}</div>
                </div>)}
              </div>
      </div>
    </>
  );
}
SearchMembersCard.propTypes = {
    users: PropTypes.array,
    label: PropTypes.string,
    className: PropTypes.string,
    selectedUsers: PropTypes.array,
    handleMembersSelect: PropTypes.func,
  };

export default SearchMembersCard;
