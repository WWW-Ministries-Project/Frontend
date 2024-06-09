import EventsCard from "./Components/EventsCard";
import GridWrapper from "/src/Wrappers/GridWrapper";
import EventsManagerHeader from "./Components/EventsManagerHeader";
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import axios from "/src/axiosInstance";
import Calendar from "./Components/Calenda";


const EventsManagement = () => {
    const navigate = useNavigate();
    const [events,setEvents] = useState([]);
    const [filter,setFilter] = useState({});
    const handleNavigation = (path) => {
        navigate(path);
    }
    const handleChange = (name,value) => {
        setFilter((prev) => ({...prev,[name]:value}))
    }
    const handleFilter = () => {
        if(filter.month && filter.year){
            return axios.get(`/event/list-events?month=${filter.month}&year=${filter.year}`).then((res) => setEvents(res.data.data))
        }else if(filter.month){
            return axios.get(`/event/list-events?month=${filter.month}`).then((res) => setEvents(res.data.data))
        } else if(filter.year){
            return axios.get(`/event/list-events?year=${filter.year}`).then((res) => setEvents(res.data.data))
        }
        return axios.get(`/event/list-events`).then((res) => setEvents(res.data.data))
    }
    const [tableView, setTableView] = useState(false);
    useEffect(() => {
      axios.get("/event/list-events").then((res) => setEvents(res.data.data))  
    }, [])
    return (
        <>
            
            <EventsManagerHeader onNavigate={handleNavigation} onChange={handleChange} onFilter={handleFilter} />
            <GridWrapper>
                {events.map((event) => <EventsCard event={event} key={Math.random()} onNavigate={handleNavigation} />)}
            </GridWrapper>
            {events?<Calendar events={events}/>:""}
        </>
    );
}

export default EventsManagement;
