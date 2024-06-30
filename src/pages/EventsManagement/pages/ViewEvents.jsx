import SkeletonLoader from "@/pages/HomePage/Components/TableSkeleton";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registeredEventAttendance as attendanceColumn } from "../utils/eventHelpers";
import defaultImage1 from "/src/assets/images/default.png";
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
        <div className="container mx-auto">
            <div className="flex justify-between mb-2">
                <div className="text-2xl H500 font-bold">Event Details</div>
                <Button value="Edit" className="px-4 py-2 border border-[#dcdcdc] rounded-lg" onClick={() => { navigate(`/home/manage-event?event_id=${id}`) }} />
            </div>


            {/* <div className="lg:hidden ">
                            <img className="rounded-xl w-[50vh]" src={eventdetails.poster || defaultImage1} alt="banner for event" />
                        </div> */}
            <div className="w-full gap-x-5 flex justify-between h-[85vh]">
                <div className="w-full lg:w-3/4 bg-white gap-3 border border-1 border-[#dcdcdc]  lg:p-4 rounded-xl">
                    <section className="flex w-full rounded gap-4">
                        <div className="w-full relative  lg:w-2/3 flex flex-col xs:gap-2 md:gap-0 lg:gap-2 text-mainGray">
                            <div className="lg:hidden ">
                                <img className="rounded-xl " src={eventdetails.poster || defaultImage1} alt="banner for event" />
                            </div>
                            <div className="md:bg-white lg:bg-transparent px-4 lg:mx-0 lg:p-0 md:p-6 md:mx-8 rounded-xl md:shadow-lg lg:shadow-none md:-translate-y-16 lg:translate-y-0 ">
                                <div>
                                    <h1 className="text-2xl font-bold p-0 m-0 text-mainGray">{eventdetails.name}</h1>
                                </div>
                                <div className="flex gap-1 text">
                                    <p>{formatTime(eventdetails.start_date)}</p> | <p>{eventdetails.start_time} - {eventdetails.end_time}</p>
                                </div>
                                <div>
                                    <p className="text text-primaryViolet">
                                        <a href={`${window.location.origin}/events/register-event?event_id=${id}&event_name=${eventdetails.name}`} target="_blank" rel="noreferrer">
                                            event registration link
                                        </a>
                                    </p>
                                </div>
                                <div>
                                    <p className="text text-justify">{eventdetails.description}</p>
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:flex">
                            <img className="rounded-xl w-[50vh]" src={eventdetails.poster || defaultImage1} alt="banner for event" />
                        </div>
                    </section>
                    <section className="w-full rounded px-4">
                        <div className="w-full border-b border-lightGray py-5 mb-2">
                            <h2 className="H400 text-mainGray">Event Attendees</h2>
                        </div>
                        <div>
                            {queryLoading ? <SkeletonLoader /> : (!eventdetails.event_attendance?.length ?
                                <EmptyState msg="😞 Sorry, No attendees yet" /> :
                                <TableComponent headClass={" !font-thin"} columns={attendanceColumn} data={eventdetails.event_attendance || []} />)
                            }
                        </div>
                    </section>
                </div>
                <aside className="hidden lg:flex w-[320px] h-[320px] bg-white flex-col justify-center items-center rounded-xl border border-[#dcdcdc]">
                    <div className="w-40 mx-auto">
                        <img src={eventdetails.qr_code} alt="Qr code" className="w-full" />
                    </div>
                    <Button value="Download QR Code" className="px-4 mt-8 text-white text-xs h-8 bg-primaryViolet" loading={loading} disabled={loading} onClick={() => { handleQrDownload(eventdetails.qr_code) }} />
                </aside>
            </div>
        </div>
    );
}

export default ViewEvents;
