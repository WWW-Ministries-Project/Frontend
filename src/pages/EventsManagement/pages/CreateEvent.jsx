import ImageUpload from "@/components/ImageUpload";
import { useEffect, useState } from "react";
import EventsForm from "../Components/EventsForm";
import { eventInput } from "../utils/eventHelpers";
import { useAuth } from "/src/auth/AuthWrapper";
import axios from "/src/axiosInstance";

const CreateEvent = () => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState(eventInput);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const query = location.search;
  const params = new URLSearchParams(query);
  const id = params.get("event_id");

  useEffect(() => {
    if (id) {
      setInputValue((prev) => ({ ...prev, updated_by: user?.id }));
      axios.get(`/event/get-event?id=${id}`).then((res) => {
        setInputValue(res.data.data);
      });
    } else {
      setInputValue((prev) => ({ ...prev, created_by: user?.id }));
    }
  }, [id, user]);

  const ahandleSubmit = (val)=>{
    console.log(val,"vjv")
  }
  const handleSubmit = async (val) => {
    setLoading(true);
    const data = new FormData();
    if (file) {
      data.append("file", file);
    }

    try {
      let posterLink = '';
      if (file) {
        const uploadResponse = await axios.post("/upload", data);
        if (uploadResponse.status === 200) {
          posterLink = uploadResponse.data.result.link;
        }
      }

      const response ="";
      if (!id){
        const eventData = { ...val, poster: posterLink, created_by:user?.id };
        response = await axios.post("/event/create-event", eventData);
      }else{
        const eventData = { ...val, poster: posterLink, updated_by:user?.id };
        response = await axios.put("/event/update-event",eventData)
      }

      if (response.status === 200) {
        // setLoading(false)
        window.location.href = "/home/events";
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <section className="p-8 container  bg-white rounded-xl mx-auto">
      <h1 className="H700">Create Event</h1>
      <p className="text-sma text-lightGray py-2">
        Fill in the form below with the event details
      </p>
      <div className="hideScrollbar overflow-y-auto 2xl:h-[77vh] xl:h-[70vh] lg:h-[79vh] md:h-[75vh] sm:h-[70vh]">
        <ImageUpload onFileChange={(file) => setFile(file)} />
          
      <EventsForm inputValue={inputValue} onSubmit={handleSubmit} loading={loading} />
      </div>
    </section>
  );
};

export default CreateEvent;
