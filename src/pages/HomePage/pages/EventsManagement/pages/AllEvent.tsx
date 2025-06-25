import { Badge } from "@/components/Badge";
import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { useState, useMemo } from "react";
import EventForm from "../Components/EventsForm";

const events = [
  {
    "id": 1,
    "event_name": "Over wrong nor indeed capital",
    "event_type": "Activities",
    "event_description": "Environment present establish table cause area nothing institution."
  },
  {
    "id": 2,
    "event_name": "Process anything program",
    "event_type": "Others",
    "event_description": "American study interview factor action beyond local entire radio."
  },
  {
    "id": 3,
    "event_name": "Little hand culture",
    "event_type": "Services",
    "event_description": "Lot painting here arrive edge sign question however treatment."
  },
  {
    "id": 4,
    "event_name": "Watch employee garden state",
    "event_type": "Activities",
    "event_description": "Can without speak across provide must follow even financial entire represent state skin to face."
  },
  {
    "id": 5,
    "event_name": "Fall how toward child",
    "event_type": "Programs",
    "event_description": "Not Democrat its team be approach ok go order season individual accept fall."
  },
  {
    "id": 6,
    "event_name": "Short against with the",
    "event_type": "Programs",
    "event_description": "Oil authority cold trial outside because event according art economic doctor very."
  },
  {
    "id": 7,
    "event_name": "Camera son parent executive",
    "event_type": "Programs",
    "event_description": "During hope charge necessary out science somebody rock style culture property ability none."
  },
  {
    "id": 8,
    "event_name": "Look everybody take",
    "event_type": "Services",
    "event_description": "Clearly positive spend impact sister room will miss summer against everything drop note watch begin."
  },
  {
    "id": 9,
    "event_name": "I action social",
    "event_type": "Programs",
    "event_description": "Debate language agency middle more hundred likely offer and central hour."
  },
  {
    "id": 10,
    "event_name": "Guy than age green",
    "event_type": "Programs",
    "event_description": "Job if with concern thought wall base choice final growth meeting why."
  },
  {
    "id": 11,
    "event_name": "Last college occur know develop",
    "event_type": "Services",
    "event_description": "Season tax know all man hotel ask charge report kitchen operation."
  },
  {
    "id": 12,
    "event_name": "Life second class model",
    "event_type": "Programs",
    "event_description": "Than say money school bring yeah take stay economy serve."
  },
  {
    "id": 13,
    "event_name": "Across down college",
    "event_type": "Services",
    "event_description": "Account sea enjoy catch space remember fear government class religious almost common article probably whether."
  },
  {
    "id": 14,
    "event_name": "None suddenly and statement skin",
    "event_type": "Others",
    "event_description": "Idea up be record thought everything plan create get scene manager professional."
  },
  {
    "id": 15,
    "event_name": "Worry knowledge within",
    "event_type": "Others",
    "event_description": "Center pull first turn far add environment political nearly attack bar thus region."
  },
  {
    "id": 16,
    "event_name": "Describe although agency",
    "event_type": "Programs",
    "event_description": "Suddenly world occur operation hand ready head test alone image hundred bank add."
  },
  {
    "id": 17,
    "event_name": "Fill soon before necessary",
    "event_type": "Services",
    "event_description": "Catch able ball woman budget mind look result describe stop do worry western customer so."
  },
  {
    "id": 18,
    "event_name": "Laugh describe garden although",
    "event_type": "Programs",
    "event_description": "Attention heart individual run page although focus his eye mother role these prevent eye technology."
  },
  {
    "id": 19,
    "event_name": "Keep other teach before out",
    "event_type": "Activities",
    "event_description": "Money since billion son down catch course."
  },
  {
    "id": 20,
    "event_name": "Far people product catch",
    "event_type": "Services",
    "event_description": "Main there ability significant space else rest modern."
  },
];

// Badge color mapping
interface Event {
    id: number;
    event_name: string;
    event_type: string;
    event_description: string;
}

interface BadgeColors {
    [key: string]: string;
}

const getBadgeColor = (eventType: string): string => {
    const colors: BadgeColors = {
        "Activities": "#FF6B4D",
        "Programs": "#00CFC1", 
        "Services": "#FFD700",
        "Others": "#C1BFFF",
    };
    return colors[eventType] || "#A8E10C";
};

const AllEvent = () => {
  const [openModal, setOpenModal] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [selectedTab, setSelectedTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleModalOpenForCreate = () => {
    setCurrentData(null);
    setOpenModal(true);
  };

  const handleTabSelect = (tab) => {
    setSelectedTab(tab);
  };

  // Filter events based on selected tab and search query
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by tab
    if (selectedTab !== "All") {
      filtered = filtered.filter(event => event.event_type === selectedTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.event_name.toLowerCase().includes(query) ||
        event.event_description.toLowerCase().includes(query) ||
        event.event_type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedTab, searchQuery]);

  return ( 
    <PageOutline>
      <div>
        <HeaderControls
          title="Events"
          totalMembers={filteredEvents.length}
          subtitle="Create and manage your events"
          screenWidth={window.innerWidth}
          btnName="Create Event"
          handleClick={handleModalOpenForCreate}
        />
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative w-1/3">
          <input
            type="text"
            placeholder="Search events by name, description, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex mb-6">
        <TabSelection
          tabs={["All", "Activities", "Programs", "Services", "Others"]}
          selectedTab={selectedTab}
          onTabSelect={handleTabSelect}
        />
      </div>

      {/* Results summary */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredEvents.length} of {events.length} events
          {selectedTab !== "All" && ` in ${selectedTab}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div key={event.id} className="border rounded-xl p-4 space-y-2 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="font-semibold text-gray-900 flex-1 mr-2">
                  {event?.event_name}
                </div>
                <div className="flex-shrink-0">
                  <Badge className={`bg-[${getBadgeColor(event.event_type)}] text-xs`} >
                    {event.event_type}
                  </Badge>
                </div>
              </div>
              <div className="text-gray-600 text-sm leading-relaxed">
                {event.event_description}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? `No events match your search "${searchQuery}"`
                  : `No events found in ${selectedTab} category`
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Event form */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <EventForm
          editData={currentData}
          closeModal={() => setOpenModal(false)}
          handleMutate={() => { /* TODO: implement mutation logic */ }}
          loading={false}
        />
      </Modal>
    </PageOutline>
  );
};

export default AllEvent;