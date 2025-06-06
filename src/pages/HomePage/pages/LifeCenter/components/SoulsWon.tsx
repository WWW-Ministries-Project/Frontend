import { LifeCenterType, SoulsWon as Souls } from "@/utils/api/lifeCenter/interface";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { tableColumns } from "../utils/tableColumns";
import Modal from "@/components/Modal";
import { SoulsWonForm } from "./SoulsWonForm";
import { useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";

export function SoulsWon({LCData}:{LCData:LifeCenterType}) {
  const [soulsWonData, setSoulsWon] = useState<Souls[]>([
  {
    id: "1",
    first_name: "John",
    last_name: "Doe",
    contact: "123-456-7890",
    location: "Ghana",
    city: "Accra",
    date_won: "2025-06-01",
    won_by: "Elder Smith",
    life_center_name: "",
  },
  {
    id: "2",
    first_name: "Jane",
    last_name: "Smith",
    contact: "234-567-8901",
    location: "Ghana",
    city: "Kumasi",
    date_won: "2025-06-02",
    won_by: "Sister Mary",
     life_center_name: "",
  },
  {
    id: "3",
    first_name: "Michael",
    last_name: "Johnson",
    contact: "345-678-9012",
    location: "Ghana",
    city: "Takoradi",
    date_won: "2025-06-03",
    won_by: "Brother James",
     life_center_name: "",
  },
  {
    id: "4",
    first_name: "Esther",
    last_name: "Brown",
    contact: "456-789-0123",
    location: "Ghana",
    city: "Cape Coast",
    date_won: "2025-06-04",
    won_by: "Pastor David",
     life_center_name: "",
  },
  {
    id: "5",
    first_name: "Samuel",
    last_name: "Owusu",
    contact: "567-890-1234",
    location: "Ghana",
    city: "Tema",
    date_won: "2025-06-05",
    won_by: "Sister Grace",
    life_center_name: "",
  },
])


  const [open, setOpen] = useState(false);
  const closeModal = ()=>{
    setOpen(false)
  }

  const handleSave = (data:Souls)=>{
setSoulsWon(prev=>[data, ...prev])

closeModal()
  }
  return (
    <div>
      <HeaderControls
        title={`Souls won (${LCData.num_of_souls_won || 0})`}
        subtitle=""
        screenWidth={window.innerWidth}
        btnName="Add Record"
        handleClick={()=>setOpen(true)}
      />
      <TableComponent
        columns={tableColumns}
        data={soulsWonData ?? []}
        displayedCount={10}
      />

      <Modal open={open} onClose={closeModal}>
        <SoulsWonForm 
        onSubmit={(data) => handleSave(data)}
        onClose={closeModal}
         />
      </Modal>
    </div>
  );
}
