import ImageUpload from "@/components/ImageUpload";
import { useEffect, useState } from "react";
import EventsForm from "../Components/EventsForm";
import { eventInput } from "../utils/eventHelpers";
import { useAuth } from "/src/auth/AuthWrapper";
import axios, { pictureInstance as axiosPic } from "/src/axiosInstance";
import Modal from "@/components/Modal";
import AddSignature from "@/components/AddSignature";

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

  const ahandleSubmit = (val) => {
    console.log(val, "vjv");
  };
  const handleSubmit = async (val) => {
    setLoading(true);
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

      let response = "";
      if (!id) {
        const eventData = { ...val, poster: posterLink, created_by: user?.id };
        response = await axios.post("/event/create-event", eventData);
      } else {
        const eventData = { ...val, poster: posterLink, updated_by: user?.id };
        response = await axios.put("/event/update-event", eventData);
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
  const [open, setOpen] = useState(false);

  return (
    <section className="p-8 lg:container  bg-white mx-auto">
      <div className="hidden">
        {/* TODO  remove this from here*/}
        {/* button to open the signature upload modal */}
        <button
          onClick={() => {
            setOpen(true);
          }}
        >
          Open upload signature
        </button>

        {/* signature upload modal */}
        <Modal
          open={open}
          onClose={() => {
            setOpen(false);
          }}
        >
          <AddSignature cancel={() => setOpen(false)} />
        </Modal>
      </div>
      <h1 className="H700">Create Event</h1>
      <p className="text-sma text-lightGray py-2">
        Fill in the form below with the event details
      </p>
      <div className="hideScrollbar overflow-y-auto">
        <ImageUpload onFileChange={(file) => setFile(file)} />

        <EventsForm
          inputValue={inputValue}
          onSubmit={handleSubmit}
          loading={loading}
          updating={id ? true : false}
        />
      </div>
    </section>
  );
};

export default CreateEvent;
