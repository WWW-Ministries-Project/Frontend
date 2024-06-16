import { useEffect, useState } from "react";
import Button from "/src/components/Button";
import EmptyState from "/src/components/EmptyState";
import axios from "/src/axiosInstance";
import { formatTime } from "/src/utils/helperFunctions";
import TableComponent from "/src/pages/HomePage/Components/reusable/TableComponent";
import { registeredEventAttendance as attendanceColumn } from "../utils/eventHelpers"

const ViewEvents = () => {
    const [eventdetails, setEventdetails] = useState({});
    const [loading, setLoading] = useState(false);
    const query = location.search;
    const params = new URLSearchParams(query);
    const id = params.get('event_id');
    useEffect(() => {
        axios.get(`/event/get-event?id=${id}`).then((res) => {
            setEventdetails(res.data.data);
        })
    }, [])

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
            <div className="flex justify-between mb-8">
                <div className="text-2xl H500 font-bold">Event Details</div>
                <div>
                    <button className='px-4 py-2  border border-[#dcdcdc] rounded-lg' >Edit</button>
                </div>
            </div>

            <div className="w-full flex justify-between gap-4">

                <div className="w-2/3 border border-1 border-[#dcdcdc] p-4 rounded-xl">
                    <section className="flex w-full  rounded mb-16 gap-4">
                        <div className="w-full sm:w-1/2 md:w-2/3  flex flex-col gap-2  text-mainGray ">
                            <div>
                                <h1 className="text-2xl font-bold p-0 m-0 text-mainGray">{eventdetails.name}</h1>
                            </div>
                            <div className="flex gap-1 text">
                                <p>{formatTime(eventdetails.start_date)}</p> | <p>{eventdetails.start_time} - {eventdetails.end_time}</p>
                            </div>
                            <div>
                                <p className="text text-primaryViolet" ><a href={`${window.location.origin}/events/register-event?event_id=${id}&event_name=${eventdetails.name}`} target="_blank" rel="noreferrer">event registration link</a></p>
                            </div>
                            <div>
                                <p className="text text-justify">{eventdetails.description}</p>
                            </div>


                        </div>
                        <div>
                            <img className="rounded-xl" src="https://picsum.photos/seed/picsum/600/200" alt="" />
                        </div>
                    </section>
                    <section className="w-full  rounded ">
                        <div className="w-full border-b border-lightGray py-5 mb-2">
                            <h2 className="H400 text-mainGray">Event Attendees</h2>
                        </div>
                        <div className="flex justify-center ">
                            {!eventdetails.event_attendance ? <EmptyState msg="😞 Sorry, No attendees yet" /> :
                                <TableComponent columns={attendanceColumn} data={eventdetails.event_attendance || []} />}
                        </div>
                    </section>
                </div>
                <aside className="w-[360px] h-[360px] flex flex-col justify-center items-center rounded border border-[#dcdcdc] ">
                    <div className="w-40 mx-auto shadow">
                        <img src={eventdetails.qr_code} alt="Qr code" className="w-full" />
                    </div>
                    <Button value="Download QR Code" className=" px-4 mt-8 text-white text-xs h-8  " loading={loading} disabled={loading} onClick={() => { handleQrDownload(eventdetails.qr_code) }} />
                </aside>
            </div>
        </div>
    );
}

export default ViewEvents;
