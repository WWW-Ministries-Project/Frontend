interface SearchIconProps {
  className?: string
  onClick?: () => void
}
export default function SearchIcon({ ...props }: Readonly<SearchIconProps>) {
  return (
    <div {...props}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="8.83203"
          cy="8.87754"
          rx="7.16602"
          ry="7.21104"
          stroke="#474D66"
        />
        <path
          opacity="0.4"
          d="M17.2278 18.2958C16.9494 18.2868 16.6847 18.1722 16.4867 17.9751L14.7897 15.9915C14.4259 15.6588 14.3961 15.0933 14.723 14.7238C14.876 14.569 15.0841 14.4819 15.301 14.4819C15.518 14.4819 15.7261 14.569 15.8791 14.7238L18.0133 16.4315C18.3207 16.7462 18.4156 17.2133 18.2555 17.6241C18.0954 18.0349 17.7103 18.3126 17.2723 18.3331L17.2278 18.2958Z"
          fill="#474D66"
        />
      </svg>
    </div>
  );
}
