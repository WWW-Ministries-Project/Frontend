import EventsCard from "./Components/EventsCard";
import GridWrapper from "/src/Wrappers/GridWrapper";
import EventsManagerHeader from "./Components/EventsManagerHeader";
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import axios from "/src/axiosInstance";
import Calendar from "./Components/Calenda";
import TableAssets from "/src/assets/TableAssets";
import GridAsset from "/src/assets/GridAsset";


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
            <div className="flex gap-1 bg-lightGray p-1 rounded-md max-w-[5rem] cursor-pointer">
                <div onClick={() => setTableView(true)}><TableAssets stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView?'bg-white rounded-md':''} /></div><div onClick={() => setTableView(false)}><GridAsset stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView?'bg-lightGray rounded-md':'bg-white  rounded-md'} /></div>
              </div>
              {!tableView?<div>
                <div className="flex gap-4 my-4">
                {/* <div className="flex gap-1 bg-lightGray p-1 rounded-md max-w-[5rem] cursor-pointer">
                <div onClick={() => setTableView(true)}><TableAssets stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView?'bg-white rounded-md':''} /></div><div onClick={() => setTableView(false)}><GridAsset stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView?'bg-lightGray rounded-md':'bg-white  rounded-md'} /></div>
              </div> */}
              <EventsManagerHeader onNavigate={handleNavigation} onChange={handleChange} onFilter={handleFilter} />
                </div>
                
                <GridWrapper>
                    {events.map((event) => <EventsCard event={event} key={Math.random()} onNavigate={handleNavigation} />)}
                </GridWrapper>
              </div>
            
            :<Calendar events={events}/>}
        </>
    );
}

export default EventsManagement;
