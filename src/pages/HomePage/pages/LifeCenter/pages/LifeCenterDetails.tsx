import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import { decodeQuery } from "@/pages/HomePage/utils";
import { useParams } from "react-router-dom";

export function LifeCenterDetails() {
  const { id } = useParams();

  const LCId = decodeQuery(String(id));
  const { data ,loading} = useFetch(api.fetch.fetchLifeCenterById, { id: LCId });

const LCData = data?.data
  return (
    <div className="bg-white rounded-xl flex flex-col gap-4 m-4 p-4 min-h-[100vh] h-fit">
     { LCData && <div>
        <HeaderControls
        title={LCData.name}
        subtitle="Manage your church's life centers and track souls won"
        screenWidth={window.innerWidth}
      />
      <div>
        <div>
            img
            <p>{LCData.location}</p>
        </div>
      </div>
      </div>}
    
    </div>
  );
}


