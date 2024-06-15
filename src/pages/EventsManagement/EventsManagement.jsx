import EventsCard from "./Components/EventsCard";
import GridWrapper from "/src/Wrappers/GridWrapper";
import EventsManagerHeader from "./Components/EventsManagerHeader";
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import axios from "/src/axiosInstance";
import Calendar from "./Components/Calenda";
import GridAsset from "/src/assets/GridAsset";
import CalendarAssets from "../../assets/CalendarAsset";

const EventsManagement = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState({});
    const [tableView, setTableView] = useState(
        JSON.parse(localStorage.getItem('tableView')) || false
    );

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
        axios.get("/event/list-events").then((res) => setEvents(res.data.data))
    }, [])

    return (
        <>
            <div className={!tableView ? "flex gap-4 my-8" : 'flex gap-4 mt-8'}>
                <div className="flex gap-1 bg-lightGray p-1 rounded-md max-w-[5rem] cursor-pointer">
                    <div onClick={() => handleToggleView(true)}>
                        <CalendarAssets stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-white rounded-md' : ''} />
                    </div>
                    <div onClick={() => handleToggleView(false)}>
                        <GridAsset stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-lightGray rounded-md' : 'bg-white  rounded-md'} />
                    </div>
                </div>
                <div className="w-full">
                    <EventsManagerHeader onNavigate={handleNavigation} onChange={handleChange} onFilter={handleFilter} viewfilter={!tableView} />
                </div>
            </div>
            {!tableView ?
                <div>
                    <GridWrapper>
                        {events.map((event) => <EventsCard event={event} key={Math.random()} onNavigate={handleNavigation} />)}
                    </GridWrapper>
                </div>
                :
                <Calendar events={events} />}
        </>
    );
}

export default EventsManagement;
