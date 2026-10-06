import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type {
  DeclineRequestDto,
  MyRide,
  RideMember,
} from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { DeclineSheet } from "./components/DeclineSheet";
import { DriverRideView } from "./components/DriverRideView";
import { PassengerRideView } from "./components/PassengerRideView";
import { type MessageTarget, RideActions } from "./components/RideActions";
import { CarIcon } from "./components/RideIcons";
import { RideLoadError, RidePage, RideSkeleton } from "./components/RidePage";
import { type ReportInput, ReportSheet } from "./components/ReportSheet";
import { rideCard } from "./components/rideStyles";
import { useMyRide } from "./hooks/useMyRide";
import { useRideCatalog } from "./hooks/useRideCatalog";
import { joinNames, ridePaths } from "./utils/rideHelpers";

type Pending = "accept" | "decline" | "cancel" | "dismiss" | null;

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

/** /member/rides/mine — status, contact once accepted, cancel and report.
 *  Polls while a decision is pending on either side. */
const MyRidePage = () => {
  const navigate = useNavigate();
  const { myRide, loading, membersOnly, refresh, apply } = useMyRide({
    pollWhilePending: true,
  });
  const { catalog, refresh: refreshCatalog } = useRideCatalog();
  const [pending, setPending] = useState<Pending>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [declineTarget, setDeclineTarget] = useState<{
    id: number;
    firstName: string;
  } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  /** Apply a fresh `MyRide` from the mutation, or refetch it. */
  const settle = (next?: MyRide | null) => {
    if (next) apply(next);
    else refresh();
    refreshCatalog();
  };

  const accept = async (requestId: number) => {
    setAcceptingId(requestId);
    setPending("accept");
    try {
      const response = await api.post.acceptRideRequest(requestId);
      settle(response.data);
    } catch {
      // ApiErrorHandler has shown why (e.g. car full); show the latest state.
      settle();
    } finally {
      setAcceptingId(null);
      setPending(null);
    }
  };

  const decline = async (payload: DeclineRequestDto) => {
    if (!declineTarget) return;
    setPending("decline");
    try {
      const response = await api.post.declineRideRequest(
        declineTarget.id,
        payload
      );
      setDeclineTarget(null);
      settle(response.data);
    } catch {
      settle();
    } finally {
      setPending(null);
    }
  };

  const cancel = async () => {
    if (!myRide) return;
    setPending("cancel");
    try {
      if (myRide.role === "driver" && myRide.offer) {
        await api.post.cancelRideOffer(myRide.offer.id);
        showNotification("Your ride was cancelled.", "success");
      } else if (myRide.request) {
        const withdrawing = myRide.request.status === "PENDING";
        await api.post.cancelRideRequest(myRide.request.id);
        showNotification(
          withdrawing ? "Your request was withdrawn." : "Your seat was released.",
          "success"
        );
      }
      navigate(ridePaths.hub);
    } catch {
      settle();
      setPending(null);
    }
  };

  const findAnother = async () => {
    const request = myRide?.request;
    if (!request) return;
    setPending("dismiss");
    try {
      await api.post.dismissRideRequest(request.id);
      navigate(ridePaths.findAt(request.pickup_point.id));
    } catch {
      settle();
      setPending(null);
    }
  };

  const report = async (input: ReportInput): Promise<boolean> => {
    const rideOfferId = myRide?.offer?.id ?? myRide?.request?.ride.id;
    if (!rideOfferId) return false;
    try {
      await api.post.reportRide({
        ride_offer_id: rideOfferId,
        reason: input.reason,
        details: input.details,
        block: input.block,
        reported_user_id:
          myRide?.role === "driver" ? input.reported_user_id : undefined,
      });
      if (input.block) settle();
      return true;
    } catch {
      return false;
    }
  };

  const renderBody = () => {
    if (loading) return <RideSkeleton rows={3} />;
    // A failed poll keeps showing the last good answer.
    if (!myRide) return <RideLoadError onRetry={refresh} />;

    if (!myRide.role) {
      return (
        <div className={cn(rideCard, "flex flex-col items-center gap-3.5 px-5 py-8 text-center")}>
          <CarIcon className="h-9 w-9 text-primaryGray/60" />
          <p className="text-sm text-primaryGray">No ride this Sunday yet.</p>
          <Link
            to={ridePaths.hub}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-amber-50 px-4 text-sm font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-400/15 dark:text-amber-300"
          >
            Offer or find a ride
          </Link>
        </div>
      );
    }

    const offer = myRide.role === "driver" ? myRide.offer : null;
    const request = myRide.role === "passenger" ? myRide.request : null;
    const declined = request?.status === "DECLINED";

    let messageTargets: MessageTarget[] = [];
    let cancelVerb = "Cancel ride";
    let cancelQuestion = "";
    if (offer) {
      messageTargets = offer.passengers.flatMap((passenger) =>
        passenger.phone
          ? [{ id: passenger.id, name: passenger.name, phone: passenger.phone }]
          : []
      );
      cancelQuestion = offer.passengers.length
        ? `Cancel this ride? ${joinNames(offer.passengers.map((p) => p.first_name))} will be notified straight away.`
        : "Cancel this ride? It will be removed from Find a ride.";
    } else if (request) {
      const driver = request.ride.driver;
      if (request.status === "ACCEPTED" && driver.phone) {
        messageTargets = [{ id: driver.id, name: driver.name, phone: driver.phone }];
      }
      if (request.status === "PENDING") cancelVerb = "Withdraw request";
      cancelQuestion = `Cancel? ${driver.first_name} will be notified and your seat released.`;
    }

    return (
      <>
        {offer ? (
          <DriverRideView
            offer={offer}
            acceptingId={acceptingId}
            onAccept={accept}
            onDecline={(id, firstName) => setDeclineTarget({ id, firstName })}
          />
        ) : null}
        {request ? (
          <PassengerRideView
            request={request}
            dismissing={pending === "dismiss"}
            onFindAnother={findAnother}
          />
        ) : null}

        {!declined && (offer || request) ? (
          <RideActions
            messageTargets={messageTargets}
            cancelVerb={cancelVerb}
            cancelQuestion={cancelQuestion}
            cancelling={pending === "cancel"}
            onCancel={cancel}
            onReport={() => setReportOpen(true)}
          />
        ) : null}

        <DeclineSheet
          firstName={declineTarget?.firstName ?? null}
          reasons={catalog?.decline_reasons ?? []}
          submitting={pending === "decline"}
          onClose={() => setDeclineTarget(null)}
          onDecline={decline}
        />
        <ReportSheet
          open={reportOpen}
          reasons={catalog?.report_reasons ?? []}
          members={offer ? driverReportMembers(myRide) : []}
          onClose={() => setReportOpen(false)}
          onSubmit={report}
        />
      </>
    );
  };

  return (
    <RidePage
      title="My ride"
      intro={myRide?.service_label}
      backToHub
      membersOnly={membersOnly}
    >
      {renderBody()}
    </RidePage>
  );
};

export default MyRidePage;
