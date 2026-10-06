interface CommunityPagerProps {
  skip: number;
  take: number;
  total: number;
  loading?: boolean;
  onChange: (skip: number) => void;
}

/** Previous / next pager for the skip/take Community admin lists. */
export const CommunityPager = ({
  skip,
  take,
  total,
  loading,
  onChange,
}: CommunityPagerProps) => {
  if (total <= take) return null;
  const from = total ? skip + 1 : 0;
  const to = Math.min(skip + take, total);
  const buttonClass =
    "rounded-lg border border-lightGray bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-lightGray/40 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-primaryGray">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={loading || skip === 0}
          onClick={() => onChange(Math.max(0, skip - take))}
        >
          Previous
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={loading || skip + take >= total}
          onClick={() => onChange(skip + take)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
