import SkeletonLoader from "@/pages/HomePage/Components/TableSkeleton";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { showNotification } from "@/pages/HomePage/utils";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registeredEventAttendance as attendanceColumn } from "../utils/eventHelpers";
import defaultImage1 from "/src/assets/image.svg";
import axios from "/src/axiosInstance";
import { Button } from "/src/components";
import EmptyState from "/src/components/EmptyState";
import TableComponent from "/src/pages/HomePage/Components/reusable/TableComponent";
import { formatDate, formatDatefull } from "/src/utils/helperFunctions";

const registrationColumns = [
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Email",
    accessorKey: "email",
    cell: ({ row }) => row.original.email || "-",
  },
  {
    header: "Phone",
    accessorKey: "phone",
    cell: ({ row }) => row.original.phone || "-",
  },
  {
    header: "Location",
    accessorKey: "location",
    cell: ({ row }) => row.original.location || "-",
  },
  {
    header: "Type",
    accessorKey: "is_member",
    cell: ({ row }) => (row.original.is_member ? "Member" : "Non-member"),
  },
  {
    header: "Registered",
    accessorKey: "created_at",
    cell: ({ row }) => formatDate(row.original.created_at),
  },
];

const ViewEvents = () => {
  const [eventdetails, setEventdetails] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Details");
  const query = location.search;
  const params = new URLSearchParams(query);
  const navigate = useNavigate();
  const id = params.get("event_id");

  useEffect(() => {
    if (!id) return;

    setQueryLoading(true);
    axios
      .get(`/event/get-event?id=${id}`)
      .then((res) => {
        setEventdetails(res.data.data);
      })
      .finally(() => {
        setQueryLoading(false);
      });
  }, [id]);

  const tabs = useMemo(() => {
    if (eventdetails?.requires_registration) {
      return ["Details", "Registrations"];
    }

    return ["Details"];
  }, [eventdetails?.requires_registration]);

  useEffect(() => {
    if (!tabs.includes(selectedTab)) {
      setSelectedTab("Details");
    }
  }, [selectedTab, tabs]);

  const handleCopyRegistrationUrl = async () => {
    if (!eventdetails?.public_registration_url) return;

    try {
      await navigator.clipboard.writeText(eventdetails.public_registration_url);
      showNotification("Public registration URL copied", "success");
    } catch {
      showNotification("Unable to copy the registration URL", "error");
    }
  };

  const registrationCount = eventdetails?.registration_count || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <section className="overflow-hidden rounded-3xl border border-lightGray bg-white shadow-sm">
        <div className="relative min-h-[280px] overflow-hidden bg-primary text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
            style={{
              backgroundImage: `url(${eventdetails?.poster || defaultImage1})`,
            }}
          />
          <div className="relative grid gap-6 p-6 md:grid-cols-[280px,1fr] md:p-8">
            <img
              src={eventdetails?.poster || defaultImage1}
              alt={eventdetails?.event_name || "Event"}
              className="h-56 w-full rounded-2xl object-cover shadow-lg"
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                  Event Details
                </p>
                <h1 className="text-3xl font-semibold">
                  {eventdetails?.event_name || "Event"}
                </h1>
                <p className="max-w-3xl text-sm text-white/80">
                  {eventdetails?.description || "No event description provided yet."}
                </p>
              </div>

              <div className="grid gap-3 text-sm text-white/85 md:grid-cols-2">
                <p>
                  <span className="font-semibold text-white">Date:</span>{" "}
                  {eventdetails?.start_date
                    ? `${formatDatefull(eventdetails.start_date)}${
                        eventdetails?.end_date &&
                        eventdetails.end_date !== eventdetails.start_date
                          ? ` to ${formatDatefull(eventdetails.end_date)}`
                          : ""
                      }`
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold text-white">Time:</span>{" "}
                  {eventdetails?.start_time || "-"} - {eventdetails?.end_time || "-"}
                </p>
                <p>
                  <span className="font-semibold text-white">Location:</span>{" "}
                  {eventdetails?.location || "-"}
                </p>
                <p>
                  <span className="font-semibold text-white">Registration:</span>{" "}
                  {eventdetails?.requires_registration
                    ? `${registrationCount}/${eventdetails?.registration_capacity || 0} registered`
                    : "Not required"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  value="Edit Event"
                  className="border border-white/20 bg-white/10 px-6 py-2 text-white"
                  onClick={() => navigate(`/home/manage-event?event_id=${id}`)}
                />
                {eventdetails?.requires_registration &&
                  eventdetails?.public_registration_url && (
                    <>
                      <Button
                        value="Open Public Registration"
                        className="border border-white/20 bg-white px-6 py-2 text-primary"
                        onClick={() =>
                          window.open(
                            eventdetails.public_registration_url,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                      />
                      <Button
                        value="Copy Registration URL"
                        className="border border-white/20 bg-white/10 px-6 py-2 text-white"
                        onClick={handleCopyRegistrationUrl}
                      />
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {queryLoading ? (
        <SkeletonLoader />
      ) : !eventdetails ? (
        <EmptyState
          scope="page"
          className="mx-auto w-[20rem]"
          msg="Unable to load event details"
        />
      ) : (
        <section className="space-y-6 rounded-3xl border border-lightGray bg-white p-5 shadow-sm md:p-6">
          {tabs.length > 1 && (
            <TabSelection
              tabs={tabs}
              selectedTab={selectedTab}
              onTabSelect={setSelectedTab}
            />
          )}

          {selectedTab === "Details" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Event Type",
                    value: eventdetails.event_type || "-",
                  },
                  {
                    label: "Recurrence End Date",
                    value: eventdetails.recurrence_end_date
                      ? formatDate(eventdetails.recurrence_end_date)
                      : "Not recurring",
                  },
                  {
                    label: "Registration Ends",
                    value: eventdetails.registration_end_date
                      ? formatDate(eventdetails.registration_end_date)
                      : "Not applicable",
                  },
                  {
                    label: "Registration Audience",
                    value: eventdetails.requires_registration
                      ? eventdetails.registration_audience === "MEMBERS_ONLY"
                        ? "Members Only"
                        : "Members & Non-members"
                      : "Not applicable",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-lightGray bg-gray-50 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-primaryGray">
                      {item.label}
                    </p>
                    <p className="mt-2 text-base font-semibold text-primary">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <section className="space-y-3">
                <div>
                  <h2 className="H400 text-primary">Attendance Records</h2>
                  <p className="text-sma text-primaryGray">
                    Attendance captured for this event appears here.
                  </p>
                </div>

                {!eventdetails.event_attendance?.length ? (
                  <EmptyState
                    scope="section"
                    className="mx-auto w-[20rem]"
                    msg="No attendance records yet"
                  />
                ) : (
                  <TableComponent
                    headClass="font-bold"
                    columns={attendanceColumn}
                    data={eventdetails.event_attendance || []}
                  />
                )}
              </section>
            </div>
          )}

          {selectedTab === "Registrations" && eventdetails.requires_registration && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-lightGray bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-primaryGray">
                    Capacity
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-primary">
                    {registrationCount}/{eventdetails.registration_capacity || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-lightGray bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-primaryGray">
                    Registration Ends
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-primary">
                    {eventdetails.registration_end_date
                      ? formatDate(eventdetails.registration_end_date)
                      : "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-lightGray bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-primaryGray">
                    Public URL
                  </p>
                  <p className="mt-2 break-all text-sm font-medium text-primary">
                    {eventdetails.public_registration_url || "-"}
                  </p>
                </div>
              </div>

              {!eventdetails.event_registers?.length ? (
                <EmptyState
                  scope="section"
                  className="mx-auto w-[20rem]"
                  msg="No registrations yet"
                />
              ) : (
                <TableComponent
                  headClass="font-bold"
                  columns={registrationColumns}
                  data={eventdetails.event_registers}
                />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ViewEvents;
