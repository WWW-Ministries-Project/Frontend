import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import RequisitionSummary from "../components/RequisitionSummary";
import EditableTable from "../components/EditableTable";
import RequisitionComments from "../components/RequisitionComments";
import RequisitionSignatureSection from "../components/RequisitionSignatureSection";

const RequestDetails = () => {
  return (
    <PageOutline>
      <PageHeader title="Requesition Details">
        <div className="flex gap-2">
          <Button value="Edit" className={"tertiary"} />
          <Button value="Disapprove" className={"secondary"} />
          <Button value="Approve" className={"primary"} />
        </div>
      </PageHeader>
      <section className="grid grid-cols-4 gap-4 ">
        <section className="border rounded-xl p-3 col-span-3 sm:col-span-full md:col-span-4 lg:col-span-3 xl:col-span-3 border-[#D9D9D9] h-fit">
          <div className="flex gap-3">
            {/* <div className="flex justify-center items-center bg-lightGray w-[7rem] h-[7rem] rounded-full p-3">  */}
            <ProfilePic
              alt="profile pic"
              className="w-[7rem] h-[7rem] border shadow-md"
              name="Janet Jackson"
            />
            {/* </div> */}
            <div>
              <div className="font-bold"> Janet Jackson</div>
              <div className="text-mainGray"> Registry | Director</div>
              <div className="text-mainGray"> marygilbert@google.com</div>
            </div>
          </div>
          <HorizontalLine />
          <div className="pl-4">
            <PageHeader title="Request Details" />
          </div>
          <EditableTable isEditable={false} />
          <HorizontalLine />
          <RequisitionSignatureSection />
        </section>
        <section className="flex flex-col sm:flex-col md:flex-row lg:flex-col xl:flex-col gap-4 col-span-1 sm:col-span-full md:col-span-4 lg:col-span-1 xl:col-span-1">
          <RequisitionSummary />
          <RequisitionComments />
        </section>
      </section>
    </PageOutline>
  );
};

export default RequestDetails;
