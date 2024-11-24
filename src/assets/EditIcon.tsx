export default function EditIcon({ fill }: { fill: string }) {
  return (
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M19.4942 3.38898C19.5896 3.53379 19.6321 3.70708 19.6146 3.8796C19.597 4.05212 19.5205 4.2133 19.3978 4.33591L10.1665 13.5662C10.072 13.6606 9.95419 13.7282 9.82504 13.762L5.98006 14.7662C5.85296 14.7993 5.71941 14.7987 5.59265 14.7643C5.46589 14.7298 5.35033 14.6629 5.25745 14.57C5.16457 14.4771 5.0976 14.3616 5.06318 14.2348C5.02876 14.108 5.02809 13.9745 5.06124 13.8474L6.06542 10.0034C6.09473 9.88804 6.15003 9.78088 6.22709 9.69013L15.4926 0.430703C15.6338 0.289668 15.8252 0.210449 16.0248 0.210449C16.2244 0.210449 16.4158 0.289668 16.557 0.430703L19.3978 3.27049C19.4339 3.30664 19.4662 3.34634 19.4942 3.38898ZM17.8002 3.8027L16.0248 2.02833L7.47126 10.5818L6.84365 12.9848L9.24664 12.3572L17.8002 3.8027Z"
          fill={fill || "#786D8F"}
        />
        <path
          d="M17.6727 15.1817C17.9471 12.836 18.0348 10.4721 17.9348 8.1124C17.9326 8.05681 17.9419 8.00137 17.9621 7.94953C17.9823 7.8977 18.013 7.85059 18.0523 7.81115L19.0404 6.82305C19.0674 6.7959 19.1016 6.77712 19.139 6.76897C19.1765 6.76082 19.2154 6.76366 19.2513 6.77712C19.2871 6.79059 19.3183 6.81413 19.3411 6.8449C19.3639 6.87567 19.3773 6.91237 19.3798 6.95058C19.5657 9.75345 19.4952 12.5674 19.1689 15.3575C18.9319 17.3879 17.3011 18.9795 15.2797 19.2054C11.7705 19.5941 8.22908 19.5941 4.71984 19.2054C2.69945 18.9795 1.06767 17.3879 0.830681 15.3575C0.41435 11.7981 0.41435 8.20236 0.830681 4.643C1.06767 2.61258 2.69844 1.02097 4.71984 0.795036C7.38328 0.499693 10.0668 0.428146 12.7422 0.581149C12.7805 0.583898 12.8172 0.597562 12.8479 0.620524C12.8787 0.643485 12.9022 0.674782 12.9158 0.710707C12.9293 0.746632 12.9322 0.78568 12.9242 0.823228C12.9163 0.860775 12.8977 0.895249 12.8707 0.922565L11.8736 1.9187C11.8345 1.95761 11.7879 1.98811 11.7366 2.00831C11.6853 2.02852 11.6304 2.03801 11.5753 2.03619C9.34281 1.9603 7.10772 2.04587 4.88754 2.29225C4.23879 2.36406 3.63318 2.65247 3.16855 3.1109C2.70392 3.56933 2.40741 4.17101 2.3269 4.81873C1.92427 8.26134 1.92427 11.7391 2.3269 15.1817C2.40741 15.8295 2.70392 16.4311 3.16855 16.8896C3.63318 17.348 4.23879 17.6364 4.88754 17.7082C8.25654 18.0848 11.743 18.0848 15.113 17.7082C15.7618 17.6364 16.3674 17.348 16.832 16.8896C17.2967 16.4311 17.5922 15.8295 17.6727 15.1817Z"
          fill={fill || "#786D8F"}
        />
      </svg>
    </div>
  );
}
