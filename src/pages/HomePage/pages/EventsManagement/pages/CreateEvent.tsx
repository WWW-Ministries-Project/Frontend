import axios, { pictureInstance as axiosPic } from "@/axiosInstance";
import ImageUpload from "@/components/ImageUpload";
import { useAuth } from "@/context/AuthWrapper";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { useEffect, useState } from "react";
import { eventInput } from "../utils/eventHelpers";
import { eventType } from "../utils/eventInterfaces";
import EventsScheduleForm from "../Components/EventsScheduleForm";

const CreateEvent = () => {
  //@ts-expect-error handle this error
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState(eventInput);
  // const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const {
    postData,
    loading: postLoading,
    error: postError,
    data: postedData,
  } = usePost(api.post.createEvent);
  const { updateData } = usePut(api.put.updateEvent);

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

  
  
  useEffect(() => {
   console.log("Input Value", inputValue);
   
  }, []);

  const handleSubmit = async (val: eventType) => {
    // setLoading(true);
    const data = new FormData();
    if (file) {
      data.append("file", file);
    }
    try {
      let posterLink = "";
      if (file) {
        const uploadResponse = await axiosPic.post("/upload", data);
        if (uploadResponse.status === 200) {
          posterLink = uploadResponse.data.result.link;
        }
      }
      if (!id) {
        const eventData = { ...val, poster: posterLink, created_by: user?.id };
        postData(eventData);
      } else {
        const eventData = { ...val, poster: posterLink, updated_by: user?.id };
        updateData(eventData);
      }
    } catch (error) {
      console.log(error);
      // setLoading(false);
    }
  };
  return (
    <div className="p-4">
      <section className="mx-auto py-8 px-16 container lg:w-4/6 bg-white rounded-xl ">
        <h1 className="H700 text-primary">Create Event</h1>
        <p className="text-sma text-primary py-2">
          Fill in the form below with the event details
        </p>
        <div className="hideScrollbar overflow-y-auto">
          <ImageUpload onFileChange={(file: File) => setFile(file)} src={""} />
          <EventsScheduleForm
            inputValue={inputValue}
            onSubmit={handleSubmit}
            loading={postLoading}
            updating={id ? true : false}
          />
        </div>
      </section>
    </div>
  );
};

export default CreateEvent;
