import SkeletonLoader from "@/pages/HomePage/Components/TableSkeleton";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registeredEventAttendance as attendanceColumn } from "../utils/eventHelpers";
import defaultImage1 from "/src/assets/image.svg";
import axios from "/src/axiosInstance";
import Button from "/src/components/Button";
import EmptyState from "/src/components/EmptyState";
import TableComponent from "/src/pages/HomePage/Components/reusable/TableComponent";
import { formatTime } from "/src/utils/helperFunctions";

const ViewEvents = () => {
    const [eventdetails, setEventdetails] = useState({});
    const [loading, setLoading] = useState(false);
    const [queryLoading, setQueryLoading] = useState(false);
    const query = location.search;
    const params = new URLSearchParams(query);
    const navigate = useNavigate();
    const id = params.get('event_id');

    useEffect(() => {
        setQueryLoading(true);
        axios.get(`/event/get-event?id=${id}`).then((res) => {
            setEventdetails(res.data.data);
            setQueryLoading(false);
        })
    }, []);

    const handleQrDownload = async (qr_code) => {
        setLoading(true);
        try {
            const response = await fetch(qr_code);
            if (!response.ok) {
                setLoading(false);
                throw new Error('Network Error: Failed to fetch QR code');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${eventdetails.name}_${formatTime(eventdetails.start_date)}.png`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url); // Clean up the object URL
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Failed to download QR code:', error);
        }
    };

    return (
        <div>
  {/* Banner Section */}
  <div
    className="h-48 sticky top-0 z-50 bg-no-repeat bg-right bg-cover"
    style={{
      backgroundImage: `url(${eventdetails.poster || defaultImage1})`,
    }}
  >
    <div className=" relative flex justify-center items-center h-48 text-white bg-black/60 overflow-hidden">
      <div className="lg:container lg:w-4/6 flex justify-between items-center w-full p-4">
        <div>
            <h1 className="text-3xl font-semibold text-white">{eventdetails.name}</h1>
            <p className="text-lg font-light text-white">{formatTime(eventdetails.start_date)} | {eventdetails.start_time} - {eventdetails.end_time}</p>
            <p className="text-lg font-light text-white"></p>
            <p className="text-lg font-light text-white ">
                  <a
                    href={`${window.location.origin}/events/register-event?event_id=${id}&event_name=${eventdetails.name}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    event registration link
                  </a>
                </p>
            <p className="text-lg font-light text-white">{eventdetails.description}</p>
        </div>
        <div className="gap-x-4 flex">
            <div>
            <Button
        value="Generate QR code"
        className="px-4 py-2 border text-white border-lightGray rounded-lg"
        onClick={() => {
          navigate(`/home/manage-event?event_id=${id}`);
        }}
      />
            </div>
            <div>
            <Button
        value="Edit"
        className="px-8 py-2  text-white border border-primaryViolet bg-primaryViolet rounded-lg"
        onClick={() => {
          navigate(`/home/manage-event?event_id=${id}`);
        }}
      />
            </div>
        </div>
      </div>
    </div>
  </div>

  {/* Main Content Section */}
  <div className="container mx-auto hideScrollbar min-h-[80vh] p-4 lg:container lg:w-4/6 bg-white rounded-b-xl  overflow-y-auto">
  

    {/* Event Details Section */}
    <div className="w-full min-h-[90%] gap-x-5 flex justify-between">
      <div className="w-full  bg-white gap-3   rounded-xl">
        
        {/* Event Attendees Section */}
        <section className="w-full ">
          <div className="w-full   mb-2">
            <h2 className="H400 text-dark900">Event Attendees</h2>
          </div>
          <div className="">
            {queryLoading ? (
              <SkeletonLoader />
            ) : !eventdetails.event_attendance?.length ? (
              <EmptyState className="w-[20rem] mx-auto" msg="😞 Sorry, No attendees yet" />
            ) : (
              <TableComponent
                headClass={"font-bold"}
                columns={attendanceColumn}
                data={eventdetails.event_attendance || []}
              />
            )}
          </div>
        </section>
      </div>

      {/* QR Code Section */}
      {/* <aside className="hidden lg:flex w-[320px] h-[320px] bg-white flex-col justify-center items-center rounded-xl border border-lightGray">
        <div className="w-40 mx-auto">
          <img src={eventdetails.qr_code} alt="Qr code" className="w-full" />
        </div>
        <Button
          value="Download QR Code"
          className="px-4 mt-8 text-white text-xs h-8 bg-primaryViolet"
          loading={loading}
          disabled={loading}
          onClick={() => {
            handleQrDownload(eventdetails.qr_code);
          }}
        />
      </aside> */}
    </div>
  </div>
</div>
    );
}

export default ViewEvents;
