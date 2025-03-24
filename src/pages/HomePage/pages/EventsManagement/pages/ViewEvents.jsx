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
    const [QRCodeModal, setQRCodeModal] = useState(false);
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

    const handleQRCodeModal = () => {
      setQRCodeModal(!QRCodeModal);
    }

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
            <div className=" sticky top-0 z-50 bg-no-repeat bg-right bg-cover  mx-4">
                <div
                    className="absolute inset-0 bg-cover"
                    style={{
                        backgroundImage: `url(${eventdetails.poster || defaultImage1})`,
                        filter: "blur(4px)", // Apply blur effect here
                        // zIndex: -1, // Ensure the image stays in the background
                        
                    }}
                ></div>
                <div className="relative flex justify-center items-center  text-white bg-black/60 overflow-hidden rounded-t-lg">
                    <div className="lg:container flex justify-between items-center w-full p-4">
                    <div className="flex items-center gap-4">
                    <div className="w-[25rem] ">
                      <img className="rounded-lg" src={eventdetails.poster || defaultImage1} alt="" />
                    </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                            <h1 className="text-2xl font-semibold text-white">{eventdetails.name}</h1>
                            <p className=" text-white">{formatTime(eventdetails.start_date)} | {eventdetails.start_time} - {eventdetails.end_time}</p>
                            <p className=" text-white"></p>
                            <p className=" text-white ">
                                <a
                                    href={`${window.location.origin}/events/register-event?event_id=${id}&event_name=${eventdetails.name}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    event registration link
                                </a>
                            </p>
                            <p className=" text-white">{eventdetails.description}</p>
                            </div>
                            <div className="gap-x-4 flex">
                            <div>
                                <Button
                                    value="Generate QR code"
                                    className="px-4 py-2 border text-white border-lightGray rounded-lg"
                                    onClick={() => {
                                        handleQRCodeModal();
                                    }}
                                />
                            </div>
                            <div>
                                <Button
                                    value="Edit"
                                    className="px-8 py-2 text-white border border-primary bg-primary rounded-lg"
                                    onClick={() => {
                                        navigate(`/home/manage-event?event_id=${id}`);
                                    }}
                                />
                            </div>
                        </div>
                        </div>
                        
                    </div>
                        
                    </div>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="container mx-auto hideScrollbar    rounded-b-xl overflow-y-auto">
                {/* Event Details Section */}
                <div className="w-full  bg-white min-h-[90%] gap-x-5 p-4 flex justify-between">
                    <div className="w-full  gap-3 rounded-xl">
                        {/* Event Attendees Section */}
                        <section className="w-full lg:container">
                            <div className="w-full mb-2">
                                <h2 className="H400 text-dark900">Event Attendees</h2>
                            </div>
                            <div>
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
                </div>
            </div>

            {/* QR code dialog */}
            {QRCodeModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center">
                    <div className="rounded p-5 w-1/3 bg-white">
                        <div className="w-2/3 mx-auto">
                            <img src={eventdetails.qr_code} alt="Qr code" className="w-full" />
                        </div>
                        <div className="flex justify-center gap-x-4">
                            <Button
                                value="Download "
                                className="px-4 text-white bg-primary"
                                loading={loading}
                                disabled={loading}
                                onClick={() => {
                                    handleQrDownload(eventdetails.qr_code);
                                }}
                            />
                            <Button
                                value="Cancel"
                                className="px-4 text-primary border border-primary"
                                loading={loading}
                                disabled={loading}
                                onClick={() => {
                                    handleQRCodeModal();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ViewEvents;
