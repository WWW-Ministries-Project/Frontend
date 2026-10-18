import { CommunityBody } from "@/pages/HomePage/pages/Community/components/CommunityBody";
import {
  authorDisplayName,
  communityPostPath,
  isGuestViewer,
  timeAgo,
} from "@/pages/HomePage/pages/Community/utils/communityHelpers";
import { POST_TYPES } from "@/pages/HomePage/pages/Community/utils/communityConstants";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils/api/apiCalls";
import type {
  CommunityFeedFilter,
  CommunityPost,
  CommunityPostType,
  CommunityReactionType,
} from "@/utils/api/community/interfaces";
import { relativePath } from "@/utils/const";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { initials } from "../utils/homeUtils";

const PREVIEW_COUNT = 3;

type Filter = "All" | "Prayer" | "Testimony" | "Notice";

/** Notices are church messages; the feed has no filter for them, so they are
 *  picked out of a wider "all" page. */
const FILTERS: Record<Filter, { feed: CommunityFeedFilter; take: number; type?: CommunityPostType }> = {
  All: { feed: "all", take: PREVIEW_COUNT },
  Prayer: { feed: "prayer", take: PREVIEW_COUNT },
  Testimony: { feed: "testimony", take: PREVIEW_COUNT },
  Notice: { feed: "all", take: 20, type: "MESSAGE" },
};

const TAG: Partial<Record<CommunityPostType, [string, string]>> = {
  PRAYER: ["#EDEBFE", "#5521B5"],
  TESTIMONY: ["#FDE8E8", "#C81E1E"],
  MESSAGE: ["#FDF6B2", "#8E4B10"],
};
const TAG_FALLBACK: [string, string] = ["#F3F4F6", "#374151"];

/** The reaction each post type invites, labelled as in the design. */
const ACTION: Partial<Record<CommunityPostType, [string, CommunityReactionType]>> = {
  PRAYER: ["Praying", "PRAY"],
  TESTIMONY: ["Amen", "PRAISE"],
  MESSAGE: ["Interested", "SUPPORT"],
};

const typeLabel = (type: CommunityPostType) =>
  type === "MESSAGE" ? "Notice" : (POST_TYPES[type] ?? POST_TYPES.GENERAL).short;

const actionFor = (post: CommunityPost) => {
  const action = ACTION[post.type];
  if (action) {
    const count = post.reactions.find((r) => r.type === action[1])?.count ?? 0;
    return `${action[0]} · ${count}`;
  }
  const total = post.reactions.reduce((sum, r) => sum + r.count, 0);
  return `Reactions · ${total}`;
};

export const CommunityCard = () => {
  const guest = isGuestViewer();
  const name = useUserStore((state) => state.name);
  const [filter, setFilter] = useState<Filter>("All");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (guest) return;
    let cancelled = false;
    const { feed, take, type } = FILTERS[filter];
    setLoaded(false);
    api.fetch
      .fetchCommunityFeed({ filter: feed, skip: 0, take })
      .then((response) => {
        if (cancelled || !Array.isArray(response.data)) return;
        const list = type ? response.data.filter((p) => p.type === type) : response.data;
        setPosts(list.slice(0, PREVIEW_COUNT));
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [guest, filter]);

  if (guest) return null;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-[clamp(16px,2.5vw,24px)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold leading-7 text-[#080D2D]">Community</h3>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-[#F3F4F6] p-1">
          {(Object.keys(FILTERS) as Filter[]).map((label) => {
            const on = label === filter;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setFilter(label)}
                className="rounded-md px-3 py-1.5 text-[13px] font-semibold"
                style={{
                  background: on ? "#fff" : "transparent",
                  color: on ? "#080D2D" : "#6B7280",
                  boxShadow: on ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <Link
        to={`${relativePath.member.community}?compose=1`}
        className="flex items-center gap-3 rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-3 hover:border-[#080D2D] hover:no-underline"
      >
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#080D2D] text-[11px] font-bold text-[#fff]">
          {initials(name)}
        </span>
        <span className="flex-1 text-sm text-[#6B7280]">Share a testimony or prayer request…</span>
        <span className="text-[13px] font-semibold text-[#080D2D]">Post</span>
      </Link>

      {loaded && posts.length === 0 && (
        <p className="py-6 text-center text-sm text-[#6B7280]">Nothing here yet.</p>
      )}

      <div className="flex flex-col">
        {posts.map((post) => {
          const [tagBg, tagFg] = TAG[post.type] ?? TAG_FALLBACK;
          const author = authorDisplayName(post);
          const path = communityPostPath(post.id);
          return (
            <article key={post.id} className="flex gap-3 border-t border-[#F3F4F6] py-4">
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-xs font-bold"
                style={{ background: tagBg, color: tagFg }}
              >
                {post.isAnonymous || !post.author ? "?" : post.author.initials || initials(author)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[#080D2D]">{author}</span>
                  <span className="text-xs text-[#6B7280]">{timeAgo(post.createdAt)}</span>
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{ background: tagBg, color: tagFg }}
                  >
                    {typeLabel(post.type)}
                  </span>
                </div>
                <CommunityBody
                  body={post.body}
                  lines={3}
                  inertLinks
                  className="text-sm leading-[22px] text-[#374151] [text-wrap:pretty]"
                />
                <div className="flex gap-4 text-[13px] font-semibold">
                  <Link to={path} className="text-[#4B5563] hover:text-[#080D2D] hover:no-underline">
                    {actionFor(post)}
                  </Link>
                  <Link to={path} className="text-[#4B5563] hover:text-[#080D2D] hover:no-underline">
                    Reply
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Link to={relativePath.member.community} className="self-start text-sm font-semibold text-[#080D2D]">
        Open community
      </Link>
    </section>
  );
};
