import data from "/data/MOCK_DATA.json";

function TableComponent(props) {
  const headers = Object.keys(data[0]);

  return (
    <>
      <table className="w-full">
        <thead>
          <tr className="text-center text-[#080808] font-normal py-4 bg-[#f8f9f999]">
            {headers.map((header) => {
              return <th key={header} className="py-4 px-1 text-left text-[#080808] font-normal">{header}</th>;
            })}
          </tr>
        </thead>
        <tbody className="bg-white">
          {data.map((row, index) => {
            return (
              <tr key={index} className="border-b-2 border-[#EBEFF2] h-20 text-dark900 leading-6 ">
                {headers.map((header,index) => {
                    return  header==="last_visited"? <td key={index}>{row[header]} days</td>:<td key={index}>{row[header]}</td>;
                 
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default TableComponent;
