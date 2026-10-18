import { encodeQuery } from "@/pages/HomePage/utils";
import { useUserStore } from "@/store/userStore";
import { relativePath } from "@/utils";
import { useNavigate } from "react-router-dom";
import { greeting, initials, longDay } from "../utils/homeUtils";

export type AnnualTheme = {
  title?: string;
  verse?: string;
  verseReference?: string;
};

export const HomeHeader = ({
  theme,
  isMemberRoute,
}: {
  theme: AnnualTheme | null;
  isMemberRoute: boolean;
}) => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state);
  const now = new Date();
  const firstName = (user.name || "").trim().split(/\s+/)[0];

  const profilePath = isMemberRoute
    ? relativePath.member.profile
    : user.id
      ? `${relativePath.home.main}/members/${encodeQuery(user.id)}`
      : "";

  const sinceYear = (() => {
    if (!user.member_since) return "";
    const d = new Date(user.member_since);
    return Number.isNaN(d.getTime()) ? "" : `Member since ${d.getFullYear()}`;
  })();
  const profileMeta = [user.member_id, sinceYear].filter(Boolean).join(" · ");

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
          {longDay(now)}
        </p>
        <h1 className="text-[clamp(24px,4vw,32px)] font-bold leading-[1.25] text-[#080D2D] [text-wrap:pretty]">
          {greeting(now)}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        {theme?.title && (
          <p className="text-[15px] text-[#4B5563] [text-wrap:pretty]">
            <span className="font-semibold text-[#080D2D]">{theme.title}</span>
            {theme.verse && <> · “{theme.verse}”</>}
            {theme.verseReference && (
              <>
                {" "}
                <span className="italic">{theme.verseReference}</span>
              </>
            )}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={!profilePath}
        onClick={() => profilePath && navigate(profilePath)}
        className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white py-2 pl-2 pr-3.5 text-left hover:border-[#080D2D] disabled:cursor-not-allowed"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#080D2D] text-sm font-bold text-[#fff]">
          {initials(user.name)}
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-[#080D2D]">My profile</span>
          {profileMeta && <span className="text-xs text-[#6B7280]">{profileMeta}</span>}
        </span>
      </button>
    </header>
  );
};
