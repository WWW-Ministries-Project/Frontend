import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";

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
      <section className="grid grid-cols-4 gap-4">
        <section className="border rounded-xl p-3 col-span-3">
          <div className="flex gap-3">
            {/* <div className="flex justify-center items-center bg-lightGray w-[7rem] h-[7rem] rounded-full p-3">  */}
            <ProfilePic
              alt="profile pic"
              className="w-[7rem] h-[7rem] border shadow-md"
            />
            {/* </div> */}
            <div>
              <div className="font-bold"> Janet Jackson</div>
              <div className="text-mainGray"> Registry | Director</div>
              <div className="text-mainGray"> marygilbert@google.com</div>
            </div>
          </div>
          <HorizontalLine />
        </section>
        <aside>
          <div className="flex flex-col gap-3"></div>
            <div className="font-bold"> Request Details</div>
            <div className="text-mainGray"> 1. Department</div>
        </aside>
      </section>
    </PageOutline>
  );
};

export default RequestDetails;
