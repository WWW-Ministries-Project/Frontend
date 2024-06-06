import EmptyState from "/src/components/EmptyState";
import QR from "/src/assets/images/QRCode.png";
import Button from "/src/components/Button";

const ViewEvents = () => {
    return (
        <div className="w-full flex justify-between gap-4">
            <div className="w-2/3 ">
                <section className="w-full bg-white shadow rounded ">
                    <div className="w-full sm:w-1/2 md:w-2/3  flex flex-col gap-5 p-4 text-lightGray ">
                        <div>
                            <h1 className="H400 text-mainGray">View Events</h1>
                            <p className="">{"props.event.name"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h2 className="H400 text-mainGray">Date</h2>
                                <p>{"props.event.start_date"}</p>
                            </div>
                            <div>
                                <h2 className="H400 text-mainGray">Time</h2>
                                <p>{"props.event.start_time"}</p>
                            </div>
                        </div>
                        <div>
                            <h2 className="H400 text-mainGray">Event Description</h2>
                            <p>{"props.event.description"}</p>
                        </div>
                        <div>
                            <h2 className="H400 text-mainGray">Event registration url</h2>
                            <p>{"props.event.link"}</p>
                        </div>

                    </div>
                </section>
                <section className="w-full bg-white shadow rounded mt-5 ">
                    <div className="w-full border-b border-lightGray p-5 mb-2">
                        <h2 className="H400 text-mainGray">Event Attendees</h2>
                    </div>
                    <div className="flex justify-center py-10">
                        <EmptyState msg="😞 Sorry, No attendees yet" />
                    </div>
                </section>
            </div>
            <aside className="w-[360px] h-[360px] flex flex-col justify-center items-center shadow rounded  ">
                    <div className="w-40 mx-auto shadow">
                        <img src={QR} alt="Qr code" className="w-full" />
                    </div>
                        <Button value="Download QR Code" className=" px-4 mt-8 text-white text-xs h-8  " />
                </aside>
        </div>
    );
}

export default ViewEvents;
