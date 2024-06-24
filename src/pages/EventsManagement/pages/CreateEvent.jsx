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

  const handleSubmit = (val)=>{
    console.log(val,"vjv")
  }
  const ahandleSubmit = async () => {
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

      const eventData = { ...inputValue, poster: posterLink };

      const response = await axios.post("/event/create-event", eventData);
      if (response.status === 200) {
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
      <div className="hideScrollbar overflow-y-auto 2xl:h-[77vh] xl:h-[70vh] lg:h-[50vh]">
        <ImageUpload onFileChange={(file) => setFile(file)} />
          
      <EventsForm inputValue={inputValue} onSubmit={handleSubmit} />
      </div>
    </section>
  );
};

export default CreateEvent;
