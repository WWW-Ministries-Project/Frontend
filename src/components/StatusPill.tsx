import { getStatusColor,getFillColor } from "@/pages/HomePage/utils/stringOperations";

export default function StatusPill({ text }: Readonly<{ text: string }>) {
  return (
    <div className={getStatusColor(text) + " flex items-center gap-2"}>
      <svg
        width="6"
        height="7"
        viewBox="0 0 6 7"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="3" cy="3.64453" r="3" fill={getFillColor(text)} />
      </svg>
      {text?.replace("_"," ")}
    </div>
  );
}
