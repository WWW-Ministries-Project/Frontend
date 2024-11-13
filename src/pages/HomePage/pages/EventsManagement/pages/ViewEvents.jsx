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
        <div className="container mx-auto hideScrollbar h-[90vh] p-8 lg:container lg:w-4/6 bg-white rounded-xl shadow-lg  overflow-y-auto ">
            <div className="flex justify-between mb-2">
            <h1 className="text-2xl font-bold p-0 m-0 text-dark900">{eventdetails.name}</h1>
                <Button value="Edit" className="px-4 py-2 border border-lightGray rounded-lg" onClick={() => { navigate(`/home/manage-event?event_id=${id}`) }} />
            </div>


            {/* <div className="lg:hidden ">
                            <img className="rounded-xl w-[50vh]" src={eventdetails.poster || defaultImage1} alt="banner for event" />
                        </div> */}
            <div className="w-full min-h-[95%] gap-x-5 flex justify-between ">
                <div className="w-full lg:w-3/4 bg-white gap-3 border border-1 border-lightGray  lg:p-4 rounded-xl">
                    <section className="flex w-full rounded gap-4">
                        <div className="w-full relative  lg:w-2/3 flex flex-col xs:gap-2 md:gap-0 lg:gap-2 text-dark900">
                            <div className="lg:hidden ">
                                <img className="rounded-xl " src={eventdetails.poster || defaultImage1} alt="banner for event" />
                            </div>
                            <div className="md:bg-white lg:bg-transparent px-4 lg:mx-0 lg:p-0 md:p-6 md:mx-8 rounded-xl md:shadow-lg lg:shadow-none md:-translate-y-16 lg:translate-y-0 ">
                                
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
                        <div className={`hidden lg:flex rounded-xl outline outline-1 outline-lightGray w-[20rem] h-[10rem] `}>
                            {/* <img className="rounded-xl w-[50vh]" src={eventdetails.poster || defaultImage1} alt="banner for event" /> */}
                            <img className='rounded-xl w-[40%] h-[20%]' src={eventdetails.poster || defaultImage1} alt="poster for event" />
                        </div>
                    </section>
                    <section className="w-full rounded px-4">
                        <div className="w-full border-b border-lightGray py-5 mb-2">
                            <h2 className="H400 text-dark900">Event Attendees</h2>
                        </div>
                        <div className="flex justify-center ">
                            {queryLoading ? <SkeletonLoader /> : (!eventdetails.event_attendance?.length ?
                                <EmptyState className='w-[20rem] ' msg="😞 Sorry, No attendees yet" /> :
                                <TableComponent headClass={" !font-thin"} columns={attendanceColumn} data={eventdetails.event_attendance || []} />)
                            }
                        </div>
                    </section>
                </div>
                <aside className="hidden lg:flex w-[320px] h-[320px] bg-white flex-col justify-center items-center rounded-xl border border-lightGray">
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
