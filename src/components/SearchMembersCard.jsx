import search from "/src/assets/search.svg";
import PropTypes from "prop-types";
function SearchMembersCard(props) {
  return (
    <>
      <div className={"p-4 border rounded-lg"+props.className}>
      <div className="py-2">
              <label className="relative block">
              <span className="sr-only">Search</span>
              <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                <svg className="h-5 w-5 fill-slate-300" viewBox="0 0 20 20">...</svg>
              </span>
              <input className="placeholder:italic placeholder:text-slate-400 block bg-white w-full border border-slate-300 rounded-md py-2 pl-9 pr-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm" placeholder="Search for anything..." type="text" name="search"/>
            </label>
              </div>

              <div className="py-2">
                <div className="flex ml-2">

                {users.slice(0,7).map((elem) => <div className="flex relative" key={elem.id}>
                  <div className="bg-blue-200 w-10 h-10 rounded-full border-4 border-white shadow-md -ml-2 overflow-hidden flex justify-center items-center">
                    <img src={elem.profile_pic} alt={elem.first_name} />
                  </div>
                </div>)}

                {users.length >= 7 && 
                  <div className="bg-slate-50 w-10 h-10 rounded-full border-4 border-white shadow-md -ml-2 z-10 flex justify-center items-center font-normal">+{users.length-7}</div>
                }
                </div>
              </div>

              <div className="flex flex-col gap-2 py-2 h-80 overflow-y-scroll">
                {users.map((elem) => <div className="flex flex-row gap-3 items-center" key={elem.id}>
                  <input type="checkbox" name="checkbox" value="" className="bg-purple-400" />
                  <div className="bg-blue-200 w-10 h-10 rounded-full overflow-hidden flex justify-center items-center"><img src={elem.profile_pic} alt={elem.first_name} /></div>
                  <div>{elem.fullname}</div>
                </div>)}
              </div>
      </div>
    </>
  );
}
SearchMembersCard.propTypes = {
    label: PropTypes.string.isRequired,
  };

export default SearchMembersCard;
