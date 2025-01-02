import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import RequisitionSummary from "../components/RequisitionSummary";
import EditableTable from "../components/EditableTable";
import RequisitionComments from "../components/RequisitionComments";
import RequisitionSignatureSection from "../components/RequisitionSignatureSection";
import api from "@/utils/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import type { IRequisitionDetails } from "../types/requestInterface";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import AddSignature from "@/components/AddSignature";
import Modal from "@/components/Modal";

import TextField from "@/pages/HomePage/Components/reusable/TextField";
import RequestAttachments from "../components/RequestAttachments";
const RequestDetails = () => {
  const { id } = useParams();
  const [openSignature, setOpenSignature] = useState(false);
  const [openComent, setOpenComent] = useState(false);
  const navigate = useNavigate();
  const { data, loading, error } = useFetch<{
    data: { data: IRequisitionDetails };
  }>(api.fetch.fetchRequisitionDetails, { id: window.atob(String(id)) });
  const requestData = useMemo(() => data?.data?.data, [data]);
  if (loading) {
    return <LoaderComponent />;
  }
  const products =
    requestData?.products?.map((data) => {
      return {
        name: data?.name,
        amount: data?.unitPrice,
        quantity: data?.quantity,
        total: data?.quantity * data?.unitPrice,
        id: String(data?.id),
      };
    }) ?? [];

  return (
    <PageOutline>
      <Modal open={openSignature} onClose={() => setOpenSignature(false)}>
        <AddSignature
          cancel={() => setOpenSignature(false)}
          handleSignature={() => {}}
          onSubmit={() => {}}
        />
      </Modal>

      <Modal open={openComent} onClose={() => setOpenComent(false)}>
        <div className="p-10">
          <TextField label="Comment" />
        </div>
      </Modal>
      <PageHeader title="Requisition Details">
        <div className="flex gap-2">
          <Button
            value="Edit"
            className={"tertiary"}
            onClick={() => navigate("/home/requests/my_requests/request/" + id)}
          />
          <Button
            value="Disapprove"
            className={"secondary"}
            onClick={() => setOpenComent(true)}
          />
          <Button
            value="Approve"
            className={"primary"}
            onClick={() => setOpenSignature(true)}
          />
        </div>
      </PageHeader>
      <section className="grid grid-cols-4 gap-4 text-dark900">
        <section className="border rounded-xl p-3 col-span-3 sm:col-span-full md:col-span-4 lg:col-span-3 xl:col-span-3 border-[#D9D9D9] h-fit">
          <div className="flex gap-3">
            <ProfilePic
              alt="profile pic"
              className="w-[7rem] h-[7rem] border shadow-md"
              name={requestData?.requester?.name}
            />
            <div>
              <div className="font-bold"> {requestData?.requester?.name}</div>
              <div className="text-mainGray">
                {requestData?.requester?.position ?? "N/A"}
              </div>
              <div className="text-mainGray">
                {requestData?.requester?.email}
              </div>
            </div>
          </div>
          <HorizontalLine />
          <div className="pl-4">
            <PageHeader title="Request Details" />
          </div>
          <EditableTable isEditable={false} data={products} />
          <HorizontalLine />
          <RequisitionSignatureSection requester = {requestData?.requester} />
        </section>
        <section className="flex flex-col sm:flex-col md:flex-row lg:flex-col xl:flex-col gap-4 col-span-1 sm:col-span-full md:col-span-4 lg:col-span-1 xl:col-span-1">
          <RequisitionSummary
            summary={requestData?.summary}
            currency={requestData?.currency}
          />
          <RequisitionComments />
          <RequestAttachments
            attachments={requestData?.attachmentLists ?? []}
          />
        </section>
      </section>
    </PageOutline>
  );
};

export default RequestDetails;
