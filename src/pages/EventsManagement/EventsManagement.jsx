import EventsCard from "./Components/EventsCard";
import GridWrapper from "/src/Wrappers/GridWrapper";

const EventsManagement = () => {
    return (
        <GridWrapper>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(() => <EventsCard key={Math.random()} />)} 
        </GridWrapper>
    );
}

export default EventsManagement;
