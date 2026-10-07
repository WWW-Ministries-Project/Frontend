/** Mobile-app screens a promotion banner can open, by the app path the mobile
 *  app routes (`actionUrlToRoute` in wwm-mobile). Add a screen here only once
 *  the app routes its path — an unknown path makes the banner a dead tap. */
export const PROMOTION_APP_SCREENS = [
  { value: "/member/give", label: "Give" },
  { value: "/member/give?segment=Pledges", label: "Give › Pledges" },
  { value: "/member/give?segment=History", label: "Give › Giving history" },
  { value: "/member/watch", label: "Sermons" },
  { value: "/member/community", label: "Community feed" },
  { value: "/member/appointments", label: "Appointments" },
  { value: "/member/market", label: "Market" },
  { value: "/member/market/orders", label: "Market › My orders" },
  { value: "/member/programs", label: "School of Ministry › Programs" },
  { value: "/member/school", label: "School of Ministry › My learning" },
  { value: "/member/life-center", label: "Life Center" },
  { value: "/member/rides/find", label: "Rides › Find a ride" },
  { value: "/member/rides", label: "Rides › My ride" },
  { value: "/member/notifications", label: "Notifications" },
] as const;

export type PromotionLinkType = "none" | "screen" | "web";

/** Same rule the API enforces for a web address. */
export const WEB_LINK_PATTERN = /^https?:\/\/[^\s/?#]+\S*$/i;

export const isWebLink = (link?: string | null) =>
  !!link && /^https?:\/\//i.test(link);

/** Splits a stored `deep_link` back into the form's link type + value. */
export const parsePromotionLink = (
  link?: string | null
): { type: PromotionLinkType; screen: string; url: string } => {
  const value = (link ?? "").trim();
  if (!value) return { type: "none", screen: "", url: "" };
  if (isWebLink(value)) return { type: "web", screen: "", url: value };
  return { type: "screen", screen: value, url: "" };
};

/** Human label for a stored link, e.g. "Give › Pledges" or the web address. */
export const describePromotionLink = (link?: string | null): string => {
  if (!link) return "Not tappable";
  if (isWebLink(link)) return `Web: ${link}`;
  const screen = PROMOTION_APP_SCREENS.find((option) => option.value === link);
  return `In app: ${screen?.label ?? link}`;
};
