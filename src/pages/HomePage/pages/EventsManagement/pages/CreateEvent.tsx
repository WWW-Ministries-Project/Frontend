import axios, { pictureInstance as axiosPic } from "@/axiosInstance";
import ImageUpload from "@/components/ImageUpload";
import { useAuth } from "@/context/AuthWrapper";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { api } from "@/utils/api/apiCalls";
import { validateUploadFile } from "@/utils/uploadValidation";
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
  const id = params.get("event_id") ?? params.get("id");
  const isUpdating = Boolean(id);
  /** "following" | "all" | null — only set when editing a series */
  const editScope = params.get("edit_scope") as "following" | "all" | null;
  const seriesId = params.get("series_id");
  const seriesFromDate = params.get("series_from_date");

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
      const validation = validateUploadFile(file, {
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      });

      if (!validation.valid) {
        throw new Error(validation.message || "Invalid event banner selected.");
      }

      data.append("file", file);
    }
    let isSuccessful = false;
    try {
      let posterLink = "";
      if (file) {
        const uploadResponse = await axiosPic.post("/upload", data);
        if (uploadResponse.status === 200) {
          posterLink = uploadResponse.data.result.link;
        }
      }
      if (!id) {
        const eventData = {
          ...val,
          ...(posterLink ? { poster: posterLink } : {}),
          created_by: user?.id,
        };
        await postData(eventData);
      } else if (editScope === "all" && seriesId) {
        // Update every occurrence in the series
        const eventData = {
          ...val,
          ...(posterLink ? { poster: posterLink } : {}),
          updated_by: user?.id,
          series_id: seriesId,
        };
        await api.put.updateEventSeries(eventData as Record<string, unknown>);
      } else if (editScope === "following" && seriesId && seriesFromDate) {
        // Update this occurrence and all future ones
        const eventData = {
          ...val,
          ...(posterLink ? { poster: posterLink } : {}),
          updated_by: user?.id,
          series_id: seriesId,
          from_date: seriesFromDate,
        };
        await api.put.updateEventSeriesFrom(eventData as Record<string, unknown>);
      } else {
        // Normal single-event update
        const eventData = {
          ...val,
          ...(posterLink ? { poster: posterLink } : {}),
          updated_by: user?.id,
        };
        await updateData(eventData, { id });
      }
      isSuccessful = true;
    } catch (error) {
      void error;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
      if (isSuccessful) {
        navigate("/home/events/events");
      }
    }
  };
  return (
    <div className="p-4 md:p-6">
      <section className="mx-auto w-full max-w-5xl rounded-xl border border-lightGray bg-white p-4 shadow-sm md:p-8">
        <h1 className="H700 text-primary">
          {!isUpdating
            ? "Schedule Event"
            : editScope === "all"
            ? "Edit All Events in Series"
            : editScope === "following"
            ? "Edit This and Following Events"
            : "Update Event Schedule"}
        </h1>
        <p className="py-2 text-sma text-primaryGray">
          {!isUpdating
            ? "Fill in the form below with event details and scheduling settings."
            : editScope === "all"
            ? "Changes will apply to every occurrence in this recurring series."
            : editScope === "following"
            ? "Changes will apply to this occurrence and all future ones in the series."
            : "Update event scheduling information and recurrence settings."}
        </p>
        <div className="hideScrollbar overflow-y-auto pt-2">
          <ImageUpload onFileChange={(file: File) => setFile(file)} src={(inputValue as any)?.poster || ""} />
          <EventsScheduleForm
            inputValue={inputValue}
            onSubmit={handleSubmit}
            loading={postLoading || isSubmitting}
            updating={isUpdating}
          />
        </div>
      </section>
    </div>
  );
};

export default CreateEvent;
