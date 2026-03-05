import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components";
import { Badge } from "@/components/Badge";
import { api, LearningUnit, LearningUnitType } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";
import { usePut } from "@/CustomHooks/usePut";

interface Props {
  topicId?: string | number;
  unit: LearningUnit | null | undefined;

  // topic-level state (authoritative)
  topicCompleted?: boolean;
  topicStatus?: "PASS" | "FAIL" | "PENDING";
  topicScore?: number;
  topicCompletedAt?: string | null;
  activation?: {
    isActive: boolean;
    activatedAt?: string | null;
    dueDate?: string | null;
    closedAt?: string | null;
  };

  userId?: string | number;
  programId?: string | number;
  refetch: () => void;
}

const typeBadgeMap: Record<
  LearningUnitType,
  { label: string; className: string }
> = {
  "lesson-note": {
    label: "Lesson Note",
    className: "bg-lightGray/40 text-primaryGray",
  },
  video: { label: "Video", className: "bg-primary/10 text-primary" },
  pdf: { label: "PDF", className: "bg-red-100 text-red-700" },
  ppt: { label: "Slides", className: "bg-yellow-100 text-yellow-700" },
  live: { label: "Live", className: "bg-green-100 text-green-700" },
  "in-person": {
    label: "In-person",
    className: "bg-secondary/10 text-secondary",
  },
  assignment: {
    label: "Assignment (MCQ)",
    className: "bg-accent/10 text-accent",
  },
  "assignment-essay": {
    label: "Assignment (Essay)",
    className: "bg-lighter/10 text-lighter",
  },
};

let youtubeApiLoadPromise: Promise<void> | null = null;

const ensureAbsoluteUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
};

const extractYouTubeVideoId = (value?: string) => {
  const candidate = value?.trim();
  if (!candidate) return null;

  const normalized = ensureAbsoluteUrl(candidate);

  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const idFromPath = url.pathname.split("/").filter(Boolean)[0];
      return idFromPath || null;
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const buildYouTubeEmbedUrl = (videoId: string) => {
  const url = new URL(`https://www.youtube.com/embed/${videoId}`);
  url.searchParams.set("enablejsapi", "1");
  url.searchParams.set("playsinline", "1");
  url.searchParams.set("rel", "0");
  return url.toString();
};

const isDirectVideoFileUrl = (value: string) =>
  /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(value);

const loadYouTubeIframeAPI = () => {
  if (typeof window === "undefined") return Promise.resolve();

  const windowWithYoutube = window as Window & {
    YT?: {
      Player?: new (
        elementId: string,
        options: {
          events?: {
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => { destroy?: () => void };
      PlayerState?: {
        ENDED?: number;
      };
    };
    onYouTubeIframeAPIReady?: (() => void) | null;
  };

  if (windowWithYoutube.YT?.Player) return Promise.resolve();
  if (youtubeApiLoadPromise) return youtubeApiLoadPromise;

  youtubeApiLoadPromise = new Promise<void>((resolve) => {
    const existingCallback = windowWithYoutube.onYouTubeIframeAPIReady;

    windowWithYoutube.onYouTubeIframeAPIReady = () => {
      existingCallback?.();
      resolve();
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });

  return youtubeApiLoadPromise;
};

export const LearningUnits: React.FC<Props> = ({
  unit,
  topicId,
  userId,
  programId,
  topicCompleted,
  topicStatus,
  topicScore,
  topicCompletedAt,
  activation,
  refetch,
}) => {
  const { updateData: markTopicAsCompleted } = usePut(api.put.markTopicAsCompleted);
  const youtubePlayerRef = useRef<{ destroy?: () => void } | null>(null);

  // MCQ state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasWatchedVideo, setHasWatchedVideo] = useState(Boolean(topicCompleted));

  const isAssignment = unit?.type === "assignment";
  const isVideo = unit?.type === "video";
  const rawVideoValue = useMemo(() => {
    if (!isVideo) return "";
    return String((unit.data as { value?: string })?.value ?? "").trim();
  }, [isVideo, unit]);

  const normalizedVideoValue = useMemo(
    () => (rawVideoValue ? ensureAbsoluteUrl(rawVideoValue) : ""),
    [rawVideoValue]
  );

  const youtubeVideoId = useMemo(
    () => (isVideo ? extractYouTubeVideoId(rawVideoValue) : null),
    [isVideo, rawVideoValue]
  );
  const isYouTubeVideo = Boolean(youtubeVideoId);
  const isDirectVideoFile = useMemo(
    () => isDirectVideoFileUrl(normalizedVideoValue),
    [normalizedVideoValue]
  );
  const videoSource = useMemo(() => {
    if (!normalizedVideoValue) return "";
    if (youtubeVideoId) return buildYouTubeEmbedUrl(youtubeVideoId);
    return normalizedVideoValue;
  }, [normalizedVideoValue, youtubeVideoId]);

  const videoProgressStorageKey = useMemo(() => {
    if (!isVideo || !topicId || !programId || !userId) return null;
    return `video_watch_completed_${String(userId)}_${String(programId)}_${String(topicId)}`;
  }, [isVideo, topicId, programId, userId]);

  const youtubeIframeId = useMemo(() => {
    if (!isYouTubeVideo) return null;
    const topicSegment = String(topicId ?? "topic").replace(/[^a-zA-Z0-9_-]/g, "-");
    const programSegment = String(programId ?? "program").replace(/[^a-zA-Z0-9_-]/g, "-");
    return `yt-player-${programSegment}-${topicSegment}`;
  }, [isYouTubeVideo, topicId, programId]);

  const markVideoAsWatched = useCallback(() => {
    setHasWatchedVideo(true);
    if (videoProgressStorageKey) {
      localStorage.setItem(videoProgressStorageKey, "1");
    }
  }, [videoProgressStorageKey]);

  const maxAttempt = useMemo(() => {
    if (unit?.type !== "assignment") return 2;
    const fromMaxAttempt =
      typeof unit.data.maxAttempt === "number" ? unit.data.maxAttempt : 0;
    const fromMaxAttempts =
      typeof unit.data.maxAttempts === "number" ? unit.data.maxAttempts : 0;
    return Math.max(fromMaxAttempt, fromMaxAttempts, 2);
  }, [unit]);

  const retryStorageKey = useMemo(() => {
    if (!isAssignment || !topicId || !programId || !userId) return null;
    return `assignment_attempts_${String(userId)}_${String(programId)}_${String(topicId)}`;
  }, [isAssignment, topicId, programId, userId]);

  const dueDateValue = activation?.dueDate ? new Date(activation.dueDate) : null;
  const dueDateTimestamp = dueDateValue?.getTime();
  const isDueDatePassed =
    typeof dueDateTimestamp === "number" &&
    !Number.isNaN(dueDateTimestamp) &&
    Date.now() > dueDateTimestamp;
  const isLockedByDueDate = Boolean(activation?.dueDate && isDueDatePassed);
  const isInactive = !activation?.isActive;
  const isClosedByFacilitator = Boolean(activation?.closedAt);
  const retriesRemaining = Math.max(maxAttempt - attemptsUsed, 0);
  const hasRetriesLeft = retriesRemaining > 0;
  const isSubmissionLocked =
    isInactive || isLockedByDueDate || isClosedByFacilitator || !hasRetriesLeft;

  const hasSubmittedAtLeastOnce =
    isAssignment &&
    (attemptsUsed > 0 ||
      topicCompleted === true ||
      topicStatus === "PASS" ||
      topicStatus === "FAIL");

  const persistAttemptCount = (nextCount: number) => {
    setAttemptsUsed(nextCount);
    if (retryStorageKey) {
      localStorage.setItem(retryStorageKey, String(nextCount));
    }
  };

  useEffect(() => {
    if (!retryStorageKey) return;

    const savedAttemptCount = localStorage.getItem(retryStorageKey);
    const parsedAttemptCount = Number(savedAttemptCount);

    if (Number.isFinite(parsedAttemptCount) && parsedAttemptCount >= 0) {
      setAttemptsUsed(parsedAttemptCount);
    }
  }, [retryStorageKey]);

  useEffect(() => {
    if (!isAssignment) return;

    const hasBackendSubmissionState =
      topicCompleted === true || topicStatus === "PASS" || topicStatus === "FAIL";

    if (!hasBackendSubmissionState || attemptsUsed > 0) return;

    setAttemptsUsed(1);
    if (retryStorageKey) {
      localStorage.setItem(retryStorageKey, "1");
    }
  }, [isAssignment, topicCompleted, topicStatus, attemptsUsed, retryStorageKey]);

  useEffect(() => {
    if (!isVideo) {
      setHasWatchedVideo(false);
      return;
    }

    if (topicCompleted) {
      setHasWatchedVideo(true);
      if (videoProgressStorageKey) {
        localStorage.setItem(videoProgressStorageKey, "1");
      }
      return;
    }

    if (!videoProgressStorageKey) {
      setHasWatchedVideo(false);
      return;
    }

    setHasWatchedVideo(localStorage.getItem(videoProgressStorageKey) === "1");
  }, [isVideo, topicCompleted, videoProgressStorageKey]);

  useEffect(() => {
    if (!isVideo || !isYouTubeVideo || !youtubeIframeId || !videoSource || topicCompleted) return;

    let isDisposed = false;

    const setupYoutubePlayer = async () => {
      try {
        await loadYouTubeIframeAPI();
      } catch {
        return;
      }

      if (isDisposed) return;

      const windowWithYoutube = window as Window & {
        YT?: {
          Player?: new (
            elementId: string,
            options: {
              events?: {
                onStateChange?: (event: { data: number }) => void;
              };
            }
          ) => { destroy?: () => void };
          PlayerState?: {
            ENDED?: number;
          };
        };
      };

      const YoutubePlayer = windowWithYoutube.YT?.Player;
      if (!YoutubePlayer) return;

      youtubePlayerRef.current?.destroy?.();
      youtubePlayerRef.current = new YoutubePlayer(youtubeIframeId, {
        events: {
          onStateChange: (event) => {
            const endedState = windowWithYoutube.YT?.PlayerState?.ENDED ?? 0;
            if (event.data === endedState || event.data === 0) {
              markVideoAsWatched();
            }
          },
        },
      });
    };

    void setupYoutubePlayer();

    return () => {
      isDisposed = true;
      youtubePlayerRef.current?.destroy?.();
      youtubePlayerRef.current = null;
    };
  }, [
    isVideo,
    isYouTubeVideo,
    youtubeIframeId,
    videoSource,
    topicCompleted,
    markVideoAsWatched,
  ]);

  const assignmentStatus = topicStatus;
  const isRetryLimitReached = !hasRetriesLeft && assignmentStatus !== "PASS";

  const assignmentLockMessage = isLockedByDueDate
    ? "This assignment is locked because the due date has passed. Submissions are no longer accepted."
    : isInactive
      ? "Assignment is not activated by facilitator."
      : isClosedByFacilitator
        ? "This assignment has been locked by the facilitator."
        : isRetryLimitReached
          ? "Retry limit reached. You cannot submit this assignment again."
          : null;

  const statusBadgeClassName = isInactive
    ? "bg-amber-100 text-amber-700"
    : "bg-green-100 text-green-700";

  const formatAssignmentDate = (value?: string | null) => {
    if (!value) return "No due date set";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "No due date set";
    return parsed.toLocaleString();
  };

  const markCompleted = async () => {
    if (isVideo && !topicCompleted && !hasWatchedVideo) {
      showNotification(
        "Watch the video to the end before marking this topic as completed.",
        "error"
      );
      return;
    }

    try {
      const payload = {
        topicId,
        userId,
      };
      await markTopicAsCompleted(payload);
      await refetch();
    } catch {
      showNotification("Could not update topic completion. Please try again.", "error");
    }
  };

  const badge = unit ? typeBadgeMap[unit.type] : undefined;

  return (
    <div className="border border-lightGray rounded-lg p-4 space-y-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Badge className={`text-xs ${badge?.className ?? ""}`}>{badge?.label}</Badge>

        <div className="flex items-center gap-3">
          {unit?.type !== "assignment" && (
            <button
              type="button"
              disabled={Boolean(topicCompleted) || (isVideo && !hasWatchedVideo)}
              onClick={() => {
                if (topicCompleted) return;
                void markCompleted();
              }}
              className={`text-xs px-3 py-1 rounded-md border ${
                topicCompleted
                  ? "bg-green-100 text-green-700 border-green-300"
                  : isVideo && !hasWatchedVideo
                    ? "bg-lightGray/20 text-primaryGray/70 border-lightGray cursor-not-allowed"
                    : "bg-white text-primaryGray border-lightGray"
              }`}
            >
              {topicCompleted
                ? "Completed"
                : isVideo && !hasWatchedVideo
                  ? "Watch video to complete"
                  : "Mark as completed"}
            </button>
          )}
        </div>
      </div>

      {/* Lesson Note */}
      {unit?.type === "lesson-note" && (
        <>
          <div
            className="prose max-w-none text-primaryGray"
            dangerouslySetInnerHTML={{ __html: unit.data.content }}
          />
        </>
      )}

      {/* Video */}
      {unit?.type === "video" && rawVideoValue && (
        <div className="space-y-3">
          {isYouTubeVideo ? (
            <div className="w-full aspect-video overflow-hidden rounded border border-lightGray/60">
              <iframe
                id={youtubeIframeId ?? undefined}
                src={videoSource}
                className="h-full w-full"
                title="YouTube Video Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : isDirectVideoFile ? (
            <video
              className="w-full overflow-hidden rounded border border-lightGray/60"
              controls
              controlsList="nodownload"
              preload="metadata"
              onEnded={markVideoAsWatched}
            >
              <source src={videoSource} />
              Your browser does not support video playback.
            </video>
          ) : (
            <div className="space-y-2">
              <div className="w-full aspect-video overflow-hidden rounded border border-lightGray/60">
                <iframe
                  src={videoSource}
                  className="h-full w-full"
                  title="Video Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-xs text-amber-700">
                Playback tracking is best supported with YouTube links or direct video files.
              </p>
            </div>
          )}

          {!topicCompleted && (
            <p className={`text-xs ${hasWatchedVideo ? "text-green-700" : "text-primaryGray"}`}>
              {hasWatchedVideo
                ? "Video watched. You can now mark this topic as completed."
                : "Watch this video to the end to unlock completion."}
            </p>
          )}
        </div>
      )}

      {/* PDF / PPT */}
      {(unit?.type === "pdf" || unit?.type === "ppt") && unit.data.link && (
        <div className="space-y-3">
          <Button
            value="Open in new tab"
            onClick={() => window.open(unit.data.link, "_blank")}
          />

          <div className="w-full h-[500px] border border-lightGray rounded-md overflow-hidden bg-lightGray/20">
            {unit.type === "pdf" && (
              <iframe
                src={`${unit.data.link}#toolbar=0&navpanes=0`}
                className="w-full h-full"
                title="PDF Viewer"
              />
            )}

            {unit.type === "ppt" && (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                  unit.data.link
                )}`}
                className="w-full h-full"
                title="Slides Viewer"
              />
            )}
          </div>
        </div>
      )}

      {/* Live */}
      {unit?.type === "live" && unit.data.value && (
        <Button
          value="Join live session"
          onClick={() => window.open(unit.data.value, "_blank")}
        />
      )}

      {/* In-person */}
      {unit?.type === "in-person" && <p className="text-sm text-primaryGray">📍 {unit.data.value}</p>}

      {/* Assignment (MCQ) */}
      {unit?.type === "assignment" && (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-lightGray bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 p-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primaryGray/80">
                Assignment Status
              </p>
              <Badge className={statusBadgeClassName}>{isInactive ? "Inactive" : "Active"}</Badge>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primaryGray/80">
                Due Date
              </p>
              <p className="text-sm font-medium text-primaryGray">
                {formatAssignmentDate(activation?.dueDate)}
              </p>
              {isLockedByDueDate && (
                <p className="text-xs text-red-600">Submission window has closed.</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primaryGray/80">
                Retries
              </p>
              <p className="text-sm font-medium text-primaryGray">
                {attemptsUsed}/{maxAttempt}
              </p>
              <p className="text-xs text-primaryGray">{retriesRemaining} remaining</p>
            </div>
          </div>

          {assignmentLockMessage && (
            <div
              className={`rounded-md border px-4 py-3 text-sm ${
                isLockedByDueDate || isRetryLimitReached
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {assignmentLockMessage}
            </div>
          )}

          {!hasSubmittedAtLeastOnce || isRetrying ? (
            <div className={`space-y-4 ${isSubmissionLocked ? "pointer-events-none opacity-65" : ""}`}>
              {(unit.data.questions || []).map((q, idx) => (
                <div key={q.id} className="space-y-2 border rounded-md p-3">
                  <p className="font-medium text-sm">
                    {idx + 1}. {q.question}
                  </p>

                  {q.options.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={q.id}
                        disabled={isSubmissionLocked}
                        checked={answers[q.id] === opt.id}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: opt.id,
                          }))
                        }
                      />
                      {opt.text}
                    </label>
                  ))}
                </div>
              ))}

              <button
                type="button"
                disabled={
                  isSubmissionLocked ||
                  Object.keys(answers).length !== unit.data.questions.length
                }
                className="mt-2 px-4 py-2 text-sm rounded-md bg-primary text-white disabled:opacity-50"
                onClick={async () => {
                  if (isInactive) {
                    showNotification("Assignment is not activated by facilitator.", "error");
                    return;
                  }

                  if (isLockedByDueDate) {
                    showNotification(
                      "This assignment is locked because the due date has passed.",
                      "error"
                    );
                    return;
                  }

                  if (!hasRetriesLeft) {
                    showNotification("Retry limit reached. You cannot submit again.", "error");
                    return;
                  }

                  const payload = {
                    userId,
                    programId,
                    topicId,
                    answers,
                  };

                  try {
                    await api.post.submitMCQAssignment(payload);
                    persistAttemptCount(attemptsUsed + 1);
                    setIsRetrying(false);
                    setAnswers({});
                    await refetch();
                  } catch (error: unknown) {
                    const err = error as { response?: { data?: { message?: string } } };
                    showNotification(
                      err.response?.data?.message ||
                        "Could not submit assignment. Please try again.",
                      "error"
                    );
                  }
                }}
              >
                {isLockedByDueDate
                  ? "Assignment Locked"
                  : !hasRetriesLeft
                    ? "No retries left"
                    : "Submit Assignment"}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-lg font-semibold">Score: {topicScore ?? 0}%</p>

              <Badge
                className={
                  assignmentStatus === "PASS"
                    ? "bg-green-100 text-green-700"
                    : assignmentStatus === "FAIL"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                }
              >
                {assignmentStatus ?? "PENDING"}
              </Badge>

              <p className="text-xs text-primaryGray">
                Completed on {topicCompletedAt ? new Date(topicCompletedAt).toLocaleString() : "In progress"}
              </p>

              {assignmentStatus === "FAIL" && hasRetriesLeft && !isSubmissionLocked && (
                <button
                  type="button"
                  className="mt-4 rounded-md bg-lightGray/30 px-4 py-2 text-sm hover:bg-lightGray/50"
                  onClick={() => {
                    setAnswers({});
                    setIsRetrying(true);
                  }}
                >
                  Retry Assignment
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assignment (Essay) */}
      {unit?.type === "assignment-essay" && (
        <div className="space-y-4">
          <div
            className="prose max-w-none text-primaryGray"
            dangerouslySetInnerHTML={{ __html: unit.data.question }}
          />

          <input
            type="file"
            className="block text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                showNotification(`Selected file: ${file.name}`, "success");
              }
            }}
          />

          <p className="text-xs text-primaryGray">
            Upload your answer as a document (PDF or Word).
          </p>
        </div>
      )}
    </div>
  );
};

export default LearningUnits;
