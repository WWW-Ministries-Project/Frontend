import Dialog from "@/components/Dialog";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import useWindowSize from "../../../../CustomHooks/useWindowSize";
import CalendarAssets from "../../../../assets/CalendarAsset";
import GridComponent from "../../Components/reusable/GridComponent";
import LoaderComponent from "../../Components/reusable/LoaderComponent";
import Calendar from "./Components/Calenda";
import EventsCard from "./Components/EventsCard";
import EventsManagerHeader from "./Components/EventsManagerHeader";
import { eventColumns } from "./utils/eventHelpers";
import GridAsset from "/src/assets/GridAsset";
import axios from "/src/axiosInstance";


//TODO: work on delete ui
const EventsManagement = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [filterByDate, setFilterByDate] = useState({ date: new Date(), month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [filterEvents, setFilterEvents] = useState("");
    const [modal, setModal] = useState({ show: false });
    const [showOptions, setShowOptions] = useState(false);
    const [queryLoading, setQueryLoading] = useState(false);
    const [tableView, setTableView] = useState(
        JSON.parse(localStorage.getItem('tableView')) || false
    );
    const { screenWidth } = useWindowSize();

    useEffect(() => {
        if (screenWidth <= 540) {
            setTableView(false);
            document.getElementById("switch").classList.add("hidden")
        } else {
            document.getElementById("switch").classList.remove("hidden")
        }
    }, [screenWidth])
    useEffect(() => {
        handleFilter();
    }, [filterByDate])
    const handleNavigation = (path) => {
        navigate(path);
    }

    const handleChange = (val) => {
        // setFilterByDate((prev) => ({ ...prev, [name]: value }))
        setFilterByDate(val);
        // console.log(val);
    }
    const handleSearchChange = (val) => {
        setFilterEvents(val);
    };

    const handleFilter = () => {
        setQueryLoading(true);

        // Construct the query string based on available filters
        const queryParams = [];
        if (filterByDate.month) {
            queryParams.push(`month=${filterByDate.month}`);
        }
        if (filterByDate.year) {
            queryParams.push(`year=${filterByDate.year}`);
        }
        const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';

        // Fetch the events
        axios.get(`/event/list-events${queryString}`)
            .then((res) => {
                setQueryLoading(false);
                setEvents(res.data.data);
            })
            .catch((error) => {
                setQueryLoading(false);
                console.error('Error fetching events:', error);
            });
    };

    const handleToggleView = (view) => {
        setTableView(view);
        localStorage.setItem('tableView', JSON.stringify(view));
    }

    const handleShowOptions = (eventId) => {
        setShowOptions((prevId) => (prevId === eventId ? null : eventId));
    }
    const handleDelete = () => {
        const id = modal.data.id
        setModal({ data: {}, show: false });
        setQueryLoading(true);
        axios.delete(`/event/delete-event/?id=${id}`).then((res) => {
            setEvents(events.filter((event) => event.id !== id));
            setQueryLoading(false);
        })
    }
    const handleDeleteModal = (val) => {
        if (val) {
            setModal(prev => {
                return { data: val, show: true }
            });
        } else {
            setModal(prev => {
                return { data: {}, show: !prev.show }
            });
        }
    }

    return (
        <div className="">
            <div className={`flex gap-4 mb-4 ${!tableView ? " my-" : ' mt-'}`}>
                <div className="flex gap-1 bg-lightGray p-1 rounded-md max-w-[5rem] cursor-pointer" id="switch">
                    <div onClick={() => handleToggleView(true)}>
                        <CalendarAssets stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-white rounded-md' : ''} />
                    </div>
                    <div onClick={() => handleToggleView(false)}>
                        <GridAsset stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-lightGray rounded-md' : 'bg-white  rounded-md'} />
                    </div>
                </div>
                <div className="w-full">
                    <EventsManagerHeader onNavigate={handleNavigation} onChange={handleChange} onFilter={handleFilter} viewfilter={!tableView}
                        filterEvents={filterEvents}
                        filterByDate={filterByDate.date}
                        onSearch={handleSearchChange} />
                </div>
            </div>
            {!tableView ?
                <GridComponent
                    columns={eventColumns}
                    data={events}
                    displayedCount={24}
                    renderRow={(row) => <EventsCard event={row.original} key={row.id} onNavigate={handleNavigation} onDelete={handleDeleteModal} showOptions={showOptions === row.original.id} onShowOptions={() => handleShowOptions(row.original.id)} />}
                    filter={filterEvents}
                    setFilter={setFilterEvents}
                />

                :
                <Calendar events={events} onDelete={handleDeleteModal} onShowOptions={handleShowOptions} showOptions={showOptions} />}
            {queryLoading && <LoaderComponent />}

            <Dialog showModal={modal.show} data={modal.data} onClick={handleDeleteModal} onDelete={handleDelete} />
        </div>
    );
}

export default EventsManagement;
