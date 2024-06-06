import EventsCard from "./Components/EventsCard";
import GridWrapper from "/src/Wrappers/GridWrapper";
import EventsManagerHeader from "./Components/EventsManagerHeader";
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import axios from "/src/axiosInstance";


const EventsManagement = () => {
    const navigate = useNavigate();
    const [events,setEvents] = useState([])
    const handleNavigation = (path) => {
        navigate(path);
    }
    useEffect(() => {
      axios.get("/event/list-events").then((res) => setEvents(res.data.data))  
    }, [])
    return (
        <>
            <EventsManagerHeader onNavigate={handleNavigation}/>
            <GridWrapper>
                {events.map((event) => <EventsCard event={event} key={Math.random()} />)}
            </GridWrapper>
        </>
    );
}

export default EventsManagement;
