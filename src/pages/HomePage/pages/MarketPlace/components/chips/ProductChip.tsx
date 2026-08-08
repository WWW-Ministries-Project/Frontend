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
      ? "bg-lightGray/40 text-primaryGray"
      : "bg-inputBackground border border-borderGray";

  return (
    <div className={`${pillStyles} rounded-lg px-2 py-1 w-fit h-fit text-xs`}>{text}</div>
  );
}