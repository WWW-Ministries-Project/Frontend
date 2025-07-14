export function ProductChip({
  section,
  text,
}: {
  section: "type" | "category" |"";
  text: string;
}) {
  const pillStyles =
    section === "category"
      ? "bg-primary text-white"
      : section === "type"
      ? "bg-[#EAECF0] text-[#474D66]"
      : "bg-[#F9F9F9] border border-[#EAECF0]";

  return (
    <div className={`${pillStyles} rounded-lg px-2 py-1 w-fit h-fit text-xs`}>{text}</div>
  );
}
