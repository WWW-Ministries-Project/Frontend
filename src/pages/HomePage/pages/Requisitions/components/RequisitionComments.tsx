import PageHeader from "@/pages/HomePage/Components/PageHeader";
import Button from "@/components/Button";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { RequestComments } from "../types/requestInterface";
import { useMemo } from "react";
import { ActionType } from "../hooks/useRequisitionDetail";


type RequisitionCommentsProps = {
  isEditable: boolean;
  comments: RequestComments[];
  openCommentModal: (type:ActionType) => void;
};
function RequisitionComments({
  isEditable,
  openCommentModal,
  comments
}: Readonly<RequisitionCommentsProps>) {
  
  const sortedComments = useMemo(() => {
    return [...comments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [comments]);
 
  return (
    <aside className="border rounded-lg p-3 border-[#D9D9D9] h-fit">
      <div className="font-semibold text-dark900 flex items-center justify-between">
        <PageHeader title="Comments" />
        <Button
          value="+ add comment"
          className="font-light text-primary cursor-pointer"
          onClick={() => openCommentModal("comment")}
        />
      </div>
      <div className="flex flex-col gap-2 max-h-[12.5rem] overflow-y-auto">
        {sortedComments.map((comment, index) => (
          <div key={comment.id} className="flex flex-col">
            <div className="text-sm text-mainGray">{comment.comment}</div>
            <div className="">{comment.request_comment_user.name}</div>
            {index !== comments.length - 1 && <HorizontalLine />}
          </div>
        ))}
      </div>
    </aside>
  );
}

export default RequisitionComments;
