import { useEffect, useState } from "react";
import QR from "/src/assets/images/QRCode.png";
import Button from "/src/components/Button";
import EmptyState from "/src/components/EmptyState";
import axios from "/src/axiosInstance";
import { formatTime } from "/src/utils/helperFunctions";
import TableComponent from "/src/pages/HomePage/Components/reusable/TableComponent";
import {registeredEventAttendance as attendanceColumn } from "../utils/eventHelpers"

const ViewEvents = () => {
    const [eventdetails, setEventdetails] = useState({});
    const query = location.search;
    const params = new URLSearchParams(query);
    const id = params.get('event_id');
    useEffect(() => {
        axios.get(`/event/get-event?id=${id}`).then((res) => {
            setEventdetails(res.data.data);
        })
    }, [])

    const handleQrDownload = () => {
        const anchor = document.createElement('a');
        anchor.href = QR; // URL of the QR code image
        anchor.download = `${eventdetails.name}_${formatTime(eventdetails.start_date)}.png`; // Filename for the downloaded image
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    };
    return (
        <div className="w-full flex justify-between gap-4">
            <div className="w-2/3 ">
                <section className="w-full bg-white shadow rounded ">
                    <div className="w-full sm:w-1/2 md:w-2/3  flex flex-col gap-5 p-4 text-mainGray ">
                        <div>
                            <h1 className="H400 text-mainGray">Event Title</h1>
                            <p className="">{eventdetails.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h2 className="H400 text-mainGray">Date</h2>
                                <p>{formatTime(eventdetails.start_date)}</p>
                            </div>
                            <div>
                                <h2 className="H400 text-mainGray">Time</h2>
                                <p>{eventdetails.start_time}</p>
                            </div>
                        </div>
                        <div>
                            <h2 className="H400 text-mainGray">Event Description</h2>
                            <p>{eventdetails.description}</p>
                        </div>
                        <div>
                            <h2 className="H400 text-mainGray">Event registration url</h2>
                            <p className="text-xs text-primaryViolet" ><a href={`${window.location.origin}/events/register-event?event_id=${id}&event_name=${eventdetails.name}`} target="_blank" rel="noreferrer">event registration link</a></p>
                        </div>

                    </div>
                </section>
                <section className="w-full bg-white shadow rounded mt-5 ">
                    <div className="w-full border-b border-lightGray p-5 mb-2">
                        <h2 className="H400 text-mainGray">Event Attendees</h2>
                    </div>
                    <div className="flex justify-center py-10">
                        {!eventdetails.event_attendance.length ? <EmptyState msg="😞 Sorry, No attendees yet" />:
                        <TableComponent columns={attendanceColumn} data={eventdetails.event_attendance || []} />}
                    </div>
                </section>
            </div>
            <aside className="w-[360px] h-[360px] flex flex-col justify-center items-center shadow-sm rounded  ">
                    <div className="w-40 mx-auto shadow">
                        <img src={eventdetails.qr_code} alt="Qr code" className="w-full" />
                    </div>
                        <Button value="Download QR Code" className=" px-4 mt-8 text-white text-xs h-8  " onClick={handleQrDownload} />
                </aside>
        </div>
    );
}

export default ViewEvents;
