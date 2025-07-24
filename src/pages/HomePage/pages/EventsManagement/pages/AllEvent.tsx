import { Badge } from "@/components/Badge";
import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { useState, useMemo, useEffect, useCallback } from "react";
import EventForm from "../Components/EventForm";
import { api, EventType } from "@/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { getBadgeColor } from "../utils/eventHelpers";
import { AllEventCard } from "../Components/AllEventCard";
import { TAB_TO_EVENT_TYPE } from "../utils/eventInterfaces";

// Tab to event type mapping


interface BadgeColors {
    [key: string]: string;
}



const AllEvent = () => {
  const [openModal, setOpenModal] = useState(false);
  const [currentData, setCurrentData] = useState<EventType | null>(null);
  const [selectedTab, setSelectedTab] = useState<keyof typeof TAB_TO_EVENT_TYPE>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Single source of truth for events
  const [allEvents, setAllEvents] = useState<EventType[]>([]);

  const { data: lcData } = useFetch(api.fetch.fetchAllUniqueEvents);
  const { executeDelete } = useDelete(api.delete.deleteUniqueEvent);
  const { postData, data, loading } = usePost(api.post.createUniqueEvent);
  const {
    updateData,
    data: update_value,
    loading: isUpdating,
  } = usePut(api.put.updateUniqueEvent);



  // Initialize events from API data
  useEffect(() => {
    if (lcData?.data?.length) {
      setAllEvents([...lcData.data]);
    }
  }, [lcData]);

  const handleModalOpenForCreate = () => {
    setCurrentData(null);
    setOpenModal(true);
  };

  const handleTabSelect = (tab: keyof typeof TAB_TO_EVENT_TYPE) => {
    setSelectedTab(tab);
  };

  // Filter events based on selected tab and search query
  const filteredEvents = useMemo(() => {
    let filtered = allEvents; // Use allEvents instead of lcData?.data

    // Filter by tab
    if (selectedTab !== "All") {
      const eventType = TAB_TO_EVENT_TYPE[selectedTab];
      if (eventType) {
        filtered = filtered.filter(event => event.event_type === eventType);
      }
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
  }, [allEvents, selectedTab, searchQuery]); // Added allEvents as dependency

  const handleDelete = (id: string) => {
      setAllEvents((prev) => prev.filter((item) => item.id !== id));
    };
    const deleteUniqueEvent = (id: string, name: string) => {
      showDeleteDialog({ id, name }, async () => {
        await executeDelete({ id: id });
        handleDelete(id);
        showNotification("Event deleted successfully", "success");
      });
    };
  
    const handleEdit = (value: EventType) => {
      setCurrentData(value);
      setOpenModal(true);
    };

  

  const editItem = useCallback((item: EventType) => {
    setAllEvents((prev) => prev.map((event) => (event.id === item.id ? item : event)));
    setOpenModal(false);
  }, []);

  const handleMutate = async (data: EventType) => {
    try {
      if (currentData) {
        await updateData(data, { id: currentData?.id });
        setCurrentData(data);
      } else {
        await postData(data);
      }
    } catch {
      showNotification("Something went wrong", "error");
    }
  };

  const addToList = (item: EventType) => {
    setAllEvents((prev) => [item, ...prev]); // Add to allEvents
    setOpenModal(false);
  };

  useEffect(() => {
    const event = data?.data as EventType | undefined;
    if (
      event &&
      typeof event.id === "number" &&
      typeof event.event_name === "string" &&
      typeof event.event_type === "string" &&
      typeof event.event_description === "string"
    ) {
      addToList(event);
      showNotification("Events created successfully", "success");
      setCurrentData(null);
    }
  }, [data?.data]);

  useEffect(() => {
    if (update_value?.data && currentData?.id) {
      const updatedData = update_value.data;
      editItem({
        id: currentData?.id,
        event_name: updatedData.event_name,
        event_type: updatedData.event_type,
        event_description: updatedData.event_description,
      });
      showNotification("Event updated successfully", "success");
      setCurrentData(null);
    }
  }, [update_value?.data, editItem]);

  return ( 
    <PageOutline>
      <div>
        <HeaderControls
          title="Events"
          totalMembers={filteredEvents?.length}
          subtitle="Create and manage your events"
          screenWidth={window.innerWidth}
          btnName="Create Event"
          handleClick={handleModalOpenForCreate}
        />
      </div>

      

      <div className="flex mb-6">
        <TabSelection
          tabs={["All", "ACTIVITY", "PROGRAM", "SERVICE", "OTHER"]}
          selectedTab={selectedTab}
          onTabSelect={handleTabSelect}
        />
      </div>

      {/* Results summary */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredEvents?.length} of {allEvents.length} events
          {selectedTab !== "All" && ` in ${selectedTab.toLowerCase()}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(filteredEvents?.length ?? 0) > 0 ? (
          (filteredEvents ?? []).map((event) => (
            <AllEventCard
            key={event.id}
                item={event}
                handleEdit={handleEdit}
                deleteUniqueEvent={deleteUniqueEvent}
              />
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
          handleMutate={handleMutate}
          loading={false}
        />
      </Modal>
    </PageOutline>
  );
};

export default AllEvent;