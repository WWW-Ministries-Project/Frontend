export default function DeleteIcon({
  fill = "#575570",
  onClick,
}: Readonly<{ fill?: string; onClick: () => void }>) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M2.3877 4.77539H3.97953H16.7142"
          stroke={fill || "#575570"}
          strokeWidth="1.59184"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.36737 4.77547V3.18363C6.36737 2.76145 6.53508 2.35656 6.83361 2.05803C7.13214 1.75951 7.53702 1.5918 7.95921 1.5918H11.1429C11.5651 1.5918 11.97 1.75951 12.2685 2.05803C12.567 2.35656 12.7347 2.76145 12.7347 3.18363V4.77547M15.1225 4.77547V15.9183C15.1225 16.3405 14.9548 16.7454 14.6562 17.0439C14.3577 17.3425 13.9528 17.5102 13.5306 17.5102H5.57145C5.14927 17.5102 4.74438 17.3425 4.44585 17.0439C4.14733 16.7454 3.97961 16.3405 3.97961 15.9183V4.77547H15.1225Z"
          stroke={fill || "#575570"}
          strokeWidth="1.59184"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.1428 8.75488V13.5304"
          stroke={fill || "#575570"}
          strokeWidth="1.59184"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.95923 8.75488V13.5304"
          stroke={fill || "#575570"}
          strokeWidth="1.59184"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
