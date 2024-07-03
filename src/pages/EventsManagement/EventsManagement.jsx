import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import useWindowSize from "../../CustomHooks/useWindowSize";
import CalendarAssets from "../../assets/CalendarAsset";
import LoaderComponent from "../HomePage/Components/reusable/LoaderComponent";
import Calendar from "./Components/Calenda";
import EventsCard from "./Components/EventsCard";
import EventsManagerHeader from "./Components/EventsManagerHeader";
import GridWrapper from "/src/Wrappers/GridWrapper";
import GridAsset from "/src/assets/GridAsset";
import axios from "/src/axiosInstance";
import GridComponent from "../HomePage/Components/reusable/GridComponent";

const EventsManagement = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState({});
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
    const handleNavigation = (path) => {
        navigate(path);
    }

    const handleChange = (name, value) => {
        setFilter((prev) => ({ ...prev, [name]: value }))
    }

    const handleFilter = () => {
        if (filter.month && filter.year) {
            return axios.get(`/event/list-events?month=${filter.month}&year=${filter.year}`).then((res) => setEvents(res.data.data))
        } else if (filter.month) {
            return axios.get(`/event/list-events?month=${filter.month}`).then((res) => setEvents(res.data.data))
        } else if (filter.year) {
            return axios.get(`/event/list-events?year=${filter.year}`).then((res) => setEvents(res.data.data))
        }
        return axios.get(`/event/list-events`).then((res) => setEvents(res.data.data))
    }

    const handleToggleView = (view) => {
        setTableView(view);
        localStorage.setItem('tableView', JSON.stringify(view));
    }

    useEffect(() => {
        setQueryLoading(true);
        axios.get("/event/list-events").then((res) => {
            setQueryLoading(false) ;
             setEvents(res.data.data);
            })
    }, [])

    return (
        <div className="">
            <div className={!tableView ? "flex gap-4 my-" : 'flex gap-4 mt-'}>
                <div className="flex gap-1 bg-lightGray p-1 rounded-md max-w-[5rem] cursor-pointer" id="switch">
                    <div onClick={() => handleToggleView(true)}>
                        <CalendarAssets stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-white rounded-md' : ''} />
                    </div>
                    <div onClick={() => handleToggleView(false)}>
                        <GridAsset stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-lightGray rounded-md' : 'bg-white  rounded-md'} />
                    </div>
                </div>
                <div className="w-full mb-4">
                    <EventsManagerHeader onNavigate={handleNavigation} onChange={handleChange} onFilter={handleFilter} viewfilter={!tableView} />
                </div>
            </div>
            {!tableView ?
                <GridComponent
                    columns={[
                    ]}
                    data={events}
                    displayedCount={24}
                    renderRow={(row) => <EventsCard event={row.original} key={row.id} onNavigate={handleNavigation} />}
                />
                :
                <Calendar events={events} />}
            {queryLoading && <LoaderComponent />}
        </div>
    );
}

export default EventsManagement;
