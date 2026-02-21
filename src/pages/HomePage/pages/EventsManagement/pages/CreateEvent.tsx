import axios, { pictureInstance as axiosPic } from "@/axiosInstance";
import ImageUpload from "@/components/ImageUpload";
import { useAuth } from "@/context/AuthWrapper";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { api } from "@/utils/api/apiCalls";
import { useEffect, useRef, useState } from "react";
import { eventInput } from "../utils/eventHelpers";
import EventsScheduleForm from "../Components/EventsScheduleForm";
import { useLocation, useNavigate } from "react-router-dom";

const CreateEvent = () => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState(eventInput);
  // const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const navigate = useNavigate()
  const location = useLocation();
  const {
    postData,
    loading: postLoading,
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

  const handleSubmit = async (val: Record<string, unknown>) => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);
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
        await postData(eventData);
      } else {
        const eventData = { ...val, poster: posterLink, updated_by: user?.id };
        await updateData(eventData);
      }
    } catch (error) {
      console.log(error);
      // setLoading(false);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
      navigate("/home/events/events")
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
            loading={postLoading || isSubmitting}
            updating={id ? true : false}
          />
        </div>
      </section>
    </div>
  );
};

export default CreateEvent;
