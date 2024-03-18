import { useState } from "react";
import PropTypes from "prop-types";
import { getInitialsFromName } from "../pages/HomePage/utils/helperFunctions";
import { useOutletContext } from "react-router-dom";

function SearchMembersCard(props) {
  const [selectedMembers, setSelectedMembers,selectedMembersRef] = useState([]);

  function handleMemberSelect(e, elem){
    try{
      if(e.target.checked){
        setSelectedMembers((prev) => [...prev, elem]);
      }else{
        setSelectedMembers((prev) => prev.filter(item => item.id === elem.id));
      }
    }catch(err){
      console.error("Could not select member")
    }
  }

  return (
    <>
      <div className={"p-4 border border-slate-300 rounded-lg " + props.className}>
      {props.members.length > 0 ? <div>
              <label className="relative block py-2">
              <span className="sr-only">Search</span>
              <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                <svg className="h-5 w-5 fill-slate-300" viewBox="0 0 20 20">...</svg>
              </span>
              <input className="placeholder:italic placeholder:text-slate-400 block bg-white w-full border border-slate-300 rounded-md py-2 pl-9 pr-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm" placeholder="Search for anything..." type="text" name="search"/>
            </label>
              </div>: null}

              <div className="py-2">
                <div className="flex ml-2">

                {selectedMembers.length > 0 && selectedMembers.slice(0,7).map((elem) => <div className="flex relative" key={elem.id}>
                  <div className="bg-blue-200 w-10 h-10 rounded-full border-4 border-white shadow-md -ml-2 overflow-hidden flex justify-center items-center">
                    {elem.user_info?.photo ? 
                    <img src={elem.user_info?.photo} alt={elem.name} />: 
                    <div>{getInitialsFromName(elem.name)}</div>}
                  </div>
                </div>)}

                {props.members.length >= 7 && 
                  <div className="bg-slate-50 w-10 h-10 rounded-full border-4 border-white shadow-md -ml-2 z-10 flex justify-center items-center font-normal">+{props.members.length-7}</div>
                }
                </div>
              </div>

              <div className={props.members.length ? "flex flex-col gap-2 py-2 min-h-60": ""}>
                {props.members && props.members.map((elem) => <div className="flex flex-row gap-3 items-center" key={elem.id}>
                  <input type="checkbox" name="checkbox" value={selectedMembers.includes(elem)} className="bg-purple-400" onChange={(e) => handleMemberSelect(e, elem)} />
                  <div className="bg-blue-200 w-10 h-10 rounded-full overflow-hidden flex justify-center items-center">
                    {elem.user_info?.photo ? 
                    <img src={elem.user_info?.photo} alt={elem.name} />: 
                    <div>{getInitialsFromName(elem.name)}</div>}
                  </div>
                  <div>{elem.name}</div>
                </div>)}
              </div>

              {!props.members.length && <div className="flex p-3 border border-slate-300 rounded-lg">
                <p>No members available</p>
              </div>}
      </div>
    </>
  );
}
SearchMembersCard.propTypes = {
    label: PropTypes.string,
  };

export default SearchMembersCard;
