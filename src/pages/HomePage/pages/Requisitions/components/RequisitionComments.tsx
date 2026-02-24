import { Button } from "@/components";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { ActionType } from "../hooks/useRequisitionDetail";
import { RequestComments } from "../types/requestInterface";

type RequisitionCommentsProps = {
  isEditable: boolean;
  comments: RequestComments[];
  openCommentModal: (type: ActionType) => void;
};

function RequisitionComments({
  isEditable,
  openCommentModal,
  comments,
}: Readonly<RequisitionCommentsProps>) {
  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [comments]
  );

  return (
    <aside className="app-card h-fit p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-primary">Comments</h3>
        {isEditable && (
          <Button
            value="+ Add comment"
            variant="secondary"
            onClick={() => openCommentModal("comment")}
          />
        )}
      </div>

      <div className="mt-3 max-h-[18rem] space-y-3 overflow-y-auto pr-1">
        {sortedComments.length > 0 ? (
          sortedComments.map((comment) => {
            const createdAt = DateTime.fromISO(comment.created_at);

            return (
              <article
                key={comment.id}
                className="rounded-lg border border-lightGray bg-white p-3"
              >
                <p className="text-sm text-primary">{comment.comment}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-primaryGray">
                  <span>
                    {comment.request_comment_user?.name || "Unknown user"}
                  </span>
                  <span>
                    {createdAt.isValid
                      ? createdAt.toFormat("dd LLL yyyy, HH:mm")
                      : "N/A"}
                  </span>
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-lightGray px-3 py-4 text-center text-sm text-primaryGray">
            No comments yet.
          </p>
        )}
      </div>
    </aside>
  );
}

export default RequisitionComments;
