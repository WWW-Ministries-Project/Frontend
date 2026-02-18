import { Outlet } from "react-router-dom";
import { Header } from "../HomePage/Components/Header";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { LoaderComponent } from "../HomePage/Components/reusable/LoaderComponent";
import CartDrawer from "../HomePage/pages/MarketPlace/components/cart/CartDrawer";

/**
 * MembersPage Layout Component
 * Provides consistent layout structure for all member-facing pages
 */
const MembersPage = () => {
    const setEvents = useStore((state) => state.setEvents);
    const { data: eventsData } = useFetch(api.fetch.fetchUpcomingEvents);

    useEffect(() => {
        if (eventsData?.data) {
            setEvents(eventsData.data);
        }
    }, [eventsData, setEvents]);

    return (
        <div className="flex min-h-screen flex-col bg-lightGray/20">
            {/* Accessibility: Skip to main content */}
            <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                aria-label="Skip to main content"
            >
                Skip to main content
            </a>

            {/* Header Section */}
            <header 
                className="sticky top-0 z-40 w-full border-b border-lightGray bg-white shadow-sm"
                role="banner"
            >
                <div className="mx-auto px-4 lg:px-16 xl:px-32 3xl:px-64 py-4 max-w-[2000px]">
                    <Header handleShowNav={() => {}} />
                </div>
            </header>

            {/* Main Content Area */}
            <main 
                id="main-content"
                className="flex-1 w-full"
                role="main"
                aria-label="Main content"
            >
                <div className="mx-auto px-4 lg:px-16 xl:px-32 3xl:px-64  max-w-[2000px]">
                    <Outlet />
                </div>
            </main>

            {/* Global UI Components */}
            <CartDrawer />
            <LoaderComponent />
        </div>
    );
};

export default MembersPage;
