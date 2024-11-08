import React, { useState } from "react";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import Button from "@/components/Button";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";

function RequisitionComments() {
  const [comments, setComments] = useState([
    {
      id: 1,
      comment: "Designing with Figma components that can be easily translated to the utility classes of Tailwind CSS is a huge timesaver!",
      by: "John Doe",
    },
  ]);

  const addComment = () => {
    setComments([...comments, {
      id: comments.length + 1,
      comment: "Designing with Figma components that can be easily translated to the utility classes of Tailwind CSS is a huge timesaver!",
      by: "John Doe",
    }]);
  }
  return (
    <aside className="border rounded-lg p-3 border-[#D9D9D9] h-fit">
      <div className="font-bold flex items-center justify-between">
        <PageHeader title="Comments" />
        <Button value="+ add comment" className="font-light text-primaryViolet" onClick={addComment} />
      </div>
      <div className="flex flex-col gap-2 max-h-[12.5rem] overflow-y-auto">
      {comments.map((comment, index)=>(
        <div key={comment.id} className="flex flex-col">
          <div className="text-sm text-mainGray">{comment.comment}</div>
          <div className="">{comment.by}</div>
          {index !== comments.length - 1 && <HorizontalLine />}
        </div>
        
      ))}
      </div>
    </aside>
  );
}

export default RequisitionComments;
