import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/utils/api/apiCalls";
import { relativePath } from "@/utils/const";
import { decodeToken } from "@/utils/helperFunctions";
import type { CommunityPost } from "@/utils/api/community/interfaces";
import { CommunityAvatar } from "@/pages/HomePage/pages/Community/components/CommunityAvatar";
import { PostTypePill } from "@/pages/HomePage/pages/Community/components/PostTypePill";
import {
  authorDisplayName,
  communityPostPath,
  isGuestViewer,
  timeAgo,
} from "@/pages/HomePage/pages/Community/utils/communityHelpers";

const PREVIEW_COUNT = 3;

/** Dashboard entry to Community: a share prompt plus the latest posts.
 *  Shown wherever the dashboard renders (member and admin), except to guests,
 *  for whom Community does not exist. */
export const CommunityPreview = () => {
  const guest = isGuestViewer();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const token = decodeToken();

  useEffect(() => {
    if (guest) return;
    let cancelled = false;
    api.fetch
      .fetchCommunityFeed({ filter: "all", skip: 0, take: PREVIEW_COUNT })
      .then((response) => {
        if (!cancelled && Array.isArray(response.data)) {
          setPosts(response.data.slice(0, PREVIEW_COUNT));
        }
      })
      .catch(() => {
        // The widget simply shows its empty state.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [guest]);

  if (guest) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="text-primary" height={24} />
          <h3 className="text-xl font-semibold text-gray-800">Community</h3>
        </div>
        <Link
          to={relativePath.member.community}
          className="text-sm font-medium text-primary hover:underline"
        >
          Open community
        </Link>
      </div>

      <Link
        to={`${relativePath.member.community}?compose=1`}
        className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200 px-3 py-2.5 transition-colors hover:bg-gray-50"
      >
        <CommunityAvatar
          size="sm"
          person={{
            name: token?.name ?? "",
            initials: "",
            avatarUrl: token?.profile_img || null,
          }}
        />
        <span className="flex-1 text-sm text-gray-500">
          Share a testimony or prayer request…
        </span>
      </Link>

      {loaded && posts.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Your church community is quiet right now. Start a conversation,
          share a testimony, or ask for prayer.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                to={communityPostPath(post.id)}
                className={`flex flex-col gap-2 rounded-lg border p-3 transition-colors hover:bg-gray-50 ${
                  post.isImportant ? "border-amber-300" : "border-gray-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <CommunityAvatar
                    size="sm"
                    person={post.author}
                    anonymous={post.isAnonymous}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {authorDisplayName(post)}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {timeAgo(post.createdAt)}
                    </span>
                  </span>
                  <PostTypePill type={post.type} />
                </span>
                <span className="line-clamp-2 whitespace-pre-line text-sm text-gray-700">
                  {post.body}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
