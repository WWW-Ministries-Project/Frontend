import type {
  CommunityFeedFilter,
  CommunityPostType,
  CommunityReactionType,
  CommunityReportReason,
} from "@/utils/api/community/interfaces";

export interface PostTypeMeta {
  emoji: string;
  /** Long label used on create chips and detail titles. */
  label: string;
  /** Short label used on the card pill. */
  short: string;
  /** Tailwind classes for the pill / selected chip. */
  pillClass: string;
  /** Lower-case noun used in sentences ("your testimony"). */
  noun: string;
}

export const POST_TYPES: Record<CommunityPostType, PostTypeMeta> = {
  PRAYER: {
    emoji: "🙏",
    label: "Prayer request",
    short: "Prayer",
    pillClass: "bg-violet-50 text-violet-700 border-violet-200",
    noun: "prayer request",
  },
  TESTIMONY: {
    emoji: "❤️",
    label: "Testimony",
    short: "Testimony",
    pillClass: "bg-rose-50 text-rose-700 border-rose-200",
    noun: "testimony",
  },
  DISCUSSION: {
    emoji: "💬",
    label: "Discussion",
    short: "Discussion",
    pillClass: "bg-sky-50 text-sky-700 border-sky-200",
    noun: "discussion",
  },
  CELEBRATION: {
    emoji: "🎉",
    label: "Celebration",
    short: "Celebration",
    pillClass: "bg-amber-50 text-amber-700 border-amber-200",
    noun: "celebration",
  },
  QUESTION: {
    emoji: "❓",
    label: "Question",
    short: "Question",
    pillClass: "bg-teal-50 text-teal-700 border-teal-200",
    noun: "question",
  },
  MESSAGE: {
    emoji: "📢",
    label: "Message",
    short: "Message",
    pillClass: "bg-amber-50 text-amber-700 border-amber-200",
    noun: "message",
  },
  GENERAL: {
    emoji: "📝",
    label: "General",
    short: "General",
    pillClass: "bg-gray-100 text-gray-700 border-gray-200",
    noun: "post",
  },
};

/** Create-post chip order. MESSAGE is appended only for Community managers. */
export const MEMBER_POST_TYPES: CommunityPostType[] = [
  "PRAYER",
  "TESTIMONY",
  "DISCUSSION",
  "CELEBRATION",
  "QUESTION",
  "GENERAL",
];

export const CREATE_PLACEHOLDERS: Partial<Record<CommunityPostType, string>> = {
  PRAYER: "What would you like your church family to pray about?",
  TESTIMONY: "What has God done? Share your story…",
  DISCUSSION: "What would you like to talk about?",
  CELEBRATION: "What are you celebrating?",
  QUESTION: "What would you like to ask?",
  MESSAGE: "What's your message?",
};

export const DEFAULT_PLACEHOLDER = "What's on your heart?";

export interface ReactionMeta {
  type: CommunityReactionType;
  emoji: string;
  label: string;
}

export const REACTIONS: ReactionMeta[] = [
  { type: "PRAY", emoji: "🙏", label: "Praying" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "PRAISE", emoji: "🙌", label: "Praise God" },
  { type: "CELEBRATE", emoji: "👏", label: "Celebrate" },
  { type: "SUPPORT", emoji: "🤝", label: "Support" },
];

export const REACTION_BY_TYPE = REACTIONS.reduce(
  (acc, reaction) => {
    acc[reaction.type] = reaction;
    return acc;
  },
  {} as Record<CommunityReactionType, ReactionMeta>
);

export const REPORT_REASONS: { value: CommunityReportReason; label: string }[] =
  [
    { value: "INAPPROPRIATE", label: "Inappropriate content" },
    { value: "HARASSMENT", label: "Harassment or bullying" },
    { value: "SAFEGUARDING", label: "Safeguarding concern" },
    { value: "SPAM", label: "Spam or advertising" },
    { value: "MISLEADING", label: "False or misleading" },
    { value: "OTHER", label: "Something else" },
  ];

export const REPORT_REASON_LABEL = REPORT_REASONS.reduce(
  (acc, reason) => {
    acc[reason.value] = reason.label;
    return acc;
  },
  {} as Record<CommunityReportReason, string>
);

export const FEED_FILTERS: { value: CommunityFeedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "prayer", label: "Prayer" },
  { value: "testimony", label: "Testimonies" },
  { value: "discussion", label: "Discussions" },
  { value: "department", label: "My department" },
];

export const FEED_EMPTY_COPY: Record<
  Exclude<CommunityFeedFilter, "department">,
  [string, string]
> = {
  all: [
    "Your church community is quiet right now.",
    "Start a conversation, share a testimony, or ask for prayer.",
  ],
  prayer: [
    "No prayer requests yet.",
    "Be the first to invite your church family to pray with you.",
  ],
  testimony: [
    "No testimonies yet.",
    "Share what God has done. It will encourage someone.",
  ],
  discussion: ["No discussions yet.", "Ask a question or start a conversation."],
};

export const NOTIFICATION_EMOJI: Record<string, string> = {
  "community.comment": "💬",
  "community.reply": "↩️",
  "community.praying": "🙏",
  "community.reaction": "❤️",
  "community.important": "📢",
  "community.department_post": "👥",
  "community.warning": "⚠️",
};

export const FEED_PAGE_SIZE = 20;
export const MAX_POST_IMAGES = 4;
export const FEED_BODY_CLAMP_LINES = 5;
