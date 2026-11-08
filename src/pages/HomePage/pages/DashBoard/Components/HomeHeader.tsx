import { useUserStore } from "@/store/userStore";
import { greeting, longDay } from "../utils/homeUtils";

export type AnnualTheme = {
  title?: string;
  verse?: string;
  verseReference?: string;
};

export const HomeHeader = ({
  theme,
}: {
  theme: AnnualTheme | null;
  isMemberRoute: boolean;
}) => {
  const user = useUserStore((state) => state);
  const now = new Date();
  const firstName = (user.name || "").trim().split(/\s+/)[0];

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-gray-500">
          {longDay(now)}
        </p>
        <h1 className="text-[clamp(24px,4vw,32px)] font-bold leading-[1.25] text-primary [text-wrap:pretty]">
          {greeting(now)}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        {theme?.title && (
          <p className="text-[15px] text-gray-600 [text-wrap:pretty]">
            <span className="font-semibold text-primary">{theme.title}</span>
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
    </header>
  );
};
