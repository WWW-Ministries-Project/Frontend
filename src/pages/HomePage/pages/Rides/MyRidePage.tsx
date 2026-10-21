import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "@/components/feedback";
import { confirmAction } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type {
  DeclineRequestDto,
  MyRide,
  RideMember,
} from "@/utils/api/rides/interfaces";
import { DeclineSheet } from "./components/DeclineSheet";
import { DriverRideView } from "./components/DriverRideView";
import { PassengerRideView } from "./components/PassengerRideView";
import { type ReportInput, ReportSheet } from "./components/ReportSheet";
import {
  DashedEmpty,
  LoadError,
  RideSkeleton,
} from "./components/rideUi";
import {
  btnPrimary,
  btnSecondary,
} from "./components/rideClasses";
import { useRidesContext } from "./hooks/useRidesContext";
import { RideColumns } from "./RidesLayout";
import {
  eventLine,
  joinNames,
  ridePaths,
  withEvent,
} from "./utils/rideHelpers";

/** Everyone a driver could report: anyone who asked to join this ride. */
const driverReportMembers = (myRide: MyRide) => {
  const offer = myRide.offer;
  if (!offer) return [];
  const members = new Map<number, Pick<RideMember, "id" | "first_name">>();
  for (const request of offer.pending_requests) {
    members.set(request.passenger.id, request.passenger);
  }
  for (const passenger of offer.passengers) members.set(passenger.id, passenger);
  for (const request of offer.declined) members.set(request.id, request);
  return [...members.values()].map(({ id, first_name }) => ({ id, first_name }));
};

/** /member/rides/mine — the member's ride to the selected event, as driver or rider:
 *  status, who's on it, contact once accepted, cancel and report. The
 *  layout polls while a decision is pending on either side. */
const MyRidePage = () => {
  const navigate = useNavigate();
  const {
    event,
    events,
    myEventIds,
    myRide,
    myRideLoading,
    refreshMyRide,
    applyMyRide,
    catalog,
    refreshCatalog,
  } = useRidesContext();
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [declining, setDeclining] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [declineTarget, setDeclineTarget] = useState<{
    id: number;
    firstName: string;
  } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  /** Apply a fresh `MyRide` from the mutation, or refetch it. */
  const settle = (next?: MyRide | null) => {
    if (next) applyMyRide(next);
    else void refreshMyRide();
    void refreshCatalog();
  };

  if (myRideLoading && !myRide) {
    return (
      <RideColumns>
        <RideSkeleton rows={3} />
      </RideColumns>
    );
  }

  // A failed poll keeps showing the last good answer.
  if (!myRide) {
    return (
      <RideColumns>
        <LoadError
          message="Couldn't load your ride. Check your connection and try again."
          onRetry={refreshMyRide}
        />
      </RideColumns>
    );
  }

  const offer = myRide.role === "driver" ? myRide.offer : null;
  const request = myRide.role === "passenger" ? myRide.request : null;
  const serviceLabel = myRide.service_label;
  const eventId = event?.id ?? null;
  const eventName = event?.name ?? serviceLabel;
  const otherRide = events.find(
    (row) => row.id !== eventId && myEventIds.includes(row.id)
  );

  if (!offer && !request) {
    return (
      <RideColumns>
        <DashedEmpty
          large
          title={`No ride yet for ${eventName}`}
          description={
            event
              ? `${eventLine(event)}. Ask for a seat with someone passing near you, or fill the empty seats in your car.`
              : "Ask for a seat with someone passing near you, or fill the empty seats in your car."
          }
        >
          <div className="flex flex-wrap justify-center gap-2">
            {otherRide ? (
              <button
                type="button"
                onClick={() => navigate(withEvent(ridePaths.mine, otherRide.id))}
                className={`${btnSecondary} min-h-[44px]`}
              >
                Your ride to {otherRide.name}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate(withEvent(ridePaths.find, eventId))}
              className={`${btnPrimary} min-h-[44px]`}
            >
              Find a ride
            </button>
            <button
              type="button"
              onClick={() => navigate(withEvent(ridePaths.offer, eventId))}
              className={`${btnSecondary} min-h-[44px]`}
            >
              Offer a ride
            </button>
          </div>
        </DashedEmpty>
      </RideColumns>
    );
  }

  const accept = async (requestId: number) => {
    const first =
      offer?.pending_requests.find((item) => item.id === requestId)?.passenger
        .first_name ?? "They";
    setAcceptingId(requestId);
    try {
      const response = await api.post.acceptRideRequest(requestId);
      settle(response.data);
      notify.success({
        title: `${first} is in`,
        message: "They can now see your phone and car details.",
      });
    } catch {
      // ApiErrorHandler has shown why (e.g. car full); show the latest state.
      settle();
    } finally {
      setAcceptingId(null);
    }
  };

  const decline = async (payload: DeclineRequestDto) => {
    if (!declineTarget) return;
    const first = declineTarget.firstName;
    setDeclining(true);
    try {
      const response = await api.post.declineRideRequest(
        declineTarget.id,
        payload
      );
      setDeclineTarget(null);
      settle(response.data);
      notify.success({
        title: "Request declined",
        message: `${first} has been told and can look for another ride.`,
      });
    } catch {
      settle();
    } finally {
      setDeclining(false);
    }
  };

  const cancelOffer = () => {
    if (!offer) return;
    const riders = offer.passengers.map((passenger) => passenger.first_name);
    confirmAction({
      title: "Cancel your ride?",
      message: riders.length
        ? `We’ll tell ${joinNames(riders)} so they can find another ride.`
        : "Your ride will be removed from search.",
      confirmLabel: "Cancel ride",
      cancelLabel: "Keep it",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.post.cancelRideOffer(offer.id);
        } catch (error) {
          settle();
          throw error;
        }
        notify.success({
          title: "Ride cancelled",
          message: riders.length
            ? "Everyone on it has been told."
            : "It’s no longer in search.",
        });
        await refreshMyRide();
        void refreshCatalog();
        navigate(withEvent(ridePaths.find, eventId));
      },
    });
  };

  const withdraw = () => {
    if (!request) return;
    const first = request.ride.driver.first_name;
    const accepted = request.status === "ACCEPTED";
    confirmAction({
      title: accepted ? "Give up your seat?" : "Withdraw your request?",
      message: accepted
        ? `${first} will be told and the seat goes back on offer.`
        : `${first} won’t see your request any more.`,
      confirmLabel: accepted ? "Give up seat" : "Withdraw",
      cancelLabel: "Keep it",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.post.cancelRideRequest(request.id);
        } catch (error) {
          settle();
          throw error;
        }
        notify.success({
          title: accepted ? "Seat released" : "Request withdrawn",
          message: "You can look for another ride.",
        });
        await refreshMyRide();
        void refreshCatalog();
        navigate(withEvent(ridePaths.find, eventId));
      },
    });
  };

  const findAnother = async () => {
    if (!request) return;
    setDismissing(true);
    try {
      await api.post.dismissRideRequest(request.id);
      await refreshMyRide();
      navigate(ridePaths.findAt(request.pickup_point.id, eventId));
    } catch {
      settle();
      setDismissing(false);
    }
  };

  const report = async (input: ReportInput): Promise<boolean> => {
    const rideOfferId = offer?.id ?? request?.ride.id;
    if (!rideOfferId) return false;
    try {
      await api.post.reportRide({
        ride_offer_id: rideOfferId,
        reason: input.reason,
        details: input.details,
        block: input.block,
        reported_user_id: offer ? input.reported_user_id : undefined,
      });
      if (input.block) settle();
      return true;
    } catch {
      return false;
    }
  };

  return (
    <RideColumns>
      {offer ? (
        <DriverRideView
          offer={offer}
          event={event}
          serviceLabel={serviceLabel}
          acceptingId={acceptingId}
          onAccept={accept}
          onDecline={(id, firstName) => setDeclineTarget({ id, firstName })}
          onCancel={cancelOffer}
          onReport={() => setReportOpen(true)}
        />
      ) : null}
      {request ? (
        <PassengerRideView
          request={request}
          event={event}
          serviceLabel={serviceLabel}
          dismissing={dismissing}
          onFindAnother={findAnother}
          onWithdraw={withdraw}
          onReport={() => setReportOpen(true)}
        />
      ) : null}

      <DeclineSheet
        firstName={declineTarget?.firstName ?? null}
        reasons={catalog?.decline_reasons ?? []}
        submitting={declining}
        onClose={() => setDeclineTarget(null)}
        onDecline={decline}
      />
      <ReportSheet
        open={reportOpen}
        reasons={catalog?.report_reasons ?? []}
        members={offer ? driverReportMembers(myRide) : []}
        defaultName={request?.ride.driver.first_name}
        onClose={() => setReportOpen(false)}
        onSubmit={report}
      />
    </RideColumns>
  );
};

export default MyRidePage;
