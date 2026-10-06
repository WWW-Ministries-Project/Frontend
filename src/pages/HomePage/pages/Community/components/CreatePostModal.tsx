import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PhotoIcon,
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { usePictureUpload } from "@/CustomHooks/usePictureUpload";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";
import { showNotification } from "@/pages/HomePage/utils";
import type {
  CommunityAudience,
  CommunityDepartment,
  CommunityPerson,
  CommunityPost,
  CommunityPostType,
  CreateCommunityPostDto,
} from "@/utils/api/community/interfaces";
import {
  CREATE_PLACEHOLDERS,
  DEFAULT_PLACEHOLDER,
  MAX_POST_IMAGES,
  MEMBER_POST_TYPES,
  POST_TYPES,
} from "../utils/communityConstants";
import { firstName, plural } from "../utils/communityHelpers";
import { CommunityAvatar } from "./CommunityAvatar";
import { useCommunityInteractions } from "./communityInteractionsContext";
import {
  sheetPrimaryButton,
  sheetSecondaryButton,
} from "../utils/communityStyles";

export interface AudienceSelection {
  kind: CommunityAudience;
  departmentId?: number | null;
  members?: CommunityPerson[];
}

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (post: CommunityPost) => void;
  canManage: boolean;
  departments: CommunityDepartment[];
  viewerName: string;
  /** Preset audience, e.g. "Post to Media Department" from a department feed. */
  initialAudience?: AudienceSelection;
}

type View = "form" | "audience" | "members";

const CHURCH: AudienceSelection = { kind: "CHURCH" };

const MEMBER_SEARCH_DEBOUNCE_MS = 250;

export const CreatePostModal = ({
  open,
  onClose,
  onCreated,
  canManage,
  departments,
  viewerName,
  initialAudience,
}: CreatePostModalProps) => {
  const { showToast } = useCommunityInteractions();
  const { handleUpload } = usePictureUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<View>("form");
  const [type, setType] = useState<CommunityPostType | null>(null);
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [audience, setAudience] = useState<AudienceSelection>(CHURCH);
  const [anonymous, setAnonymous] = useState(false);
  const [important, setImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selected-members sub-view keeps a draft until "Done".
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<CommunityPerson[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [draftMembers, setDraftMembers] = useState<CommunityPerson[]>([]);

  useEffect(() => {
    if (!open) return;
    setView("form");
    setType(null);
    setBody("");
    setImages([]);
    setAudience(initialAudience ?? CHURCH);
    setAnonymous(false);
    setImportant(false);
    setMemberQuery("");
    setMemberResults([]);
    setDraftMembers([]);
  }, [open, initialAudience]);

  useEffect(() => {
    if (view !== "members") return;
    const query = memberQuery.trim();
    if (!query) {
      setMemberResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setMemberSearching(true);
      api.fetch
        .searchCommunityMembers({ q: query, take: 20 })
        .then((response) => {
          if (!cancelled) {
            setMemberResults(Array.isArray(response.data) ? response.data : []);
          }
        })
        .catch(() => {
          if (!cancelled) setMemberResults([]);
        })
        .finally(() => {
          if (!cancelled) setMemberSearching(false);
        });
    }, MEMBER_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [memberQuery, view]);

  const typeOptions = useMemo<CommunityPostType[]>(
    () => (canManage ? [...MEMBER_POST_TYPES, "MESSAGE"] : MEMBER_POST_TYPES),
    [canManage]
  );

  const department = departments.find(
    (item) => item.id === audience.departmentId
  );
  const selectedMembers = audience.members ?? [];

  const peopleLabel = (count: number) =>
    `${count} ${count === 1 ? "person" : "people"}`;

  const audienceSummary = (() => {
    switch (audience.kind) {
      case "DEPARTMENT":
        return {
          icon: UserGroupIcon,
          title:
            departments.length > 1
              ? department?.name ?? "My department"
              : "My department",
          sub: department
            ? `${department.name} · ${plural(department.memberCount, "member")}`
            : "Choose a department",
        };
      case "SELECTED":
        return {
          icon: UserPlusIcon,
          title: "Selected members",
          sub:
            selectedMembers.length <= 3
              ? selectedMembers.map((member) => firstName(member.name)).join(", ")
              : peopleLabel(selectedMembers.length),
        };
      case "ONLY_ME":
        return {
          icon: LockClosedIcon,
          title: "Only you",
          sub: "Private · nobody else can see it",
        };
      case "CHURCH":
      default:
        return {
          icon: GlobeAltIcon,
          title: "Whole church",
          sub: "Everyone in WWM",
        };
    }
  })();

  const publishLabel = !type
    ? "Choose what you're sharing"
    : !body.trim()
      ? "Write something to post"
      : audience.kind === "ONLY_ME"
        ? "Save privately"
        : audience.kind === "CHURCH"
          ? "Post to whole church"
          : audience.kind === "DEPARTMENT"
            ? `Post to ${department?.name ?? "your department"}`
            : `Post to ${peopleLabel(selectedMembers.length)}`;

  const audienceReady =
    (audience.kind !== "DEPARTMENT" || Boolean(department)) &&
    (audience.kind !== "SELECTED" || selectedMembers.length > 0);
  const ready =
    Boolean(type) && Boolean(body.trim()) && audienceReady && !uploading;
  const showAnonymous = audience.kind !== "ONLY_ME";
  const isAnonymous = showAnonymous && anonymous;

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const slots = MAX_POST_IMAGES - images.length;
    const picked = Array.from(files).slice(0, Math.max(0, slots));
    if (files.length > slots) {
      showNotification(
        `You can add up to ${MAX_POST_IMAGES} photos.`,
        "error",
        "Community"
      );
    }
    setUploading(true);
    try {
      for (const file of picked) {
        const formData = new FormData();
        formData.append("file", file);
        const link = await handleUpload(formData);
        if (link) setImages((current) => [...current, link].slice(0, MAX_POST_IMAGES));
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const publish = async () => {
    if (!ready || !type || submitting) return;
    const payload: CreateCommunityPostDto = {
      type,
      body: body.trim(),
      audience: audience.kind,
      ...(audience.kind === "DEPARTMENT" && department
        ? { departmentId: department.id }
        : {}),
      ...(audience.kind === "SELECTED"
        ? { memberIds: selectedMembers.map((member) => member.id) }
        : {}),
      isAnonymous,
      ...(canManage && important ? { isImportant: true } : {}),
      ...(images.length ? { imageUrls: images } : {}),
    };

    setSubmitting(true);
    try {
      const response = await api.post.createCommunityPost(payload);
      if (response.data) onCreated(response.data);
      const destination =
        audience.kind === "ONLY_ME"
          ? null
          : audience.kind === "CHURCH"
            ? "whole church"
            : audience.kind === "DEPARTMENT"
              ? department?.name ?? "your department"
              : peopleLabel(selectedMembers.length);
      showToast(
        destination
          ? `${isAnonymous ? "Posted anonymously to" : "Posted to"} ${destination}`
          : "Saved privately"
      );
      onClose();
    } catch {
      // ApiErrorHandler has already shown the error; keep the draft.
    } finally {
      setSubmitting(false);
    }
  };

  const header = (title: string, onBack?: () => void) => (
    <div className="flex items-center gap-2 border-b border-lightGray px-5 py-4">
      {onBack ? (
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="rounded-lg p-1 text-primaryGray hover:bg-lightGray/40"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      ) : null}
      <h2 className="flex-1 text-lg font-semibold text-primary">{title}</h2>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="rounded-lg p-1 text-primaryGray hover:bg-lightGray/40"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );

  const audienceOption = ({
    key,
    icon: Icon,
    label,
    sub,
    selected,
    chevron,
    onSelect,
  }: {
    key: string;
    icon: typeof GlobeAltIcon;
    label: string;
    sub: string;
    selected: boolean;
    chevron?: boolean;
    onSelect: () => void;
  }) => (
    <button
      key={key}
      type="button"
      role={chevron ? undefined : "radio"}
      aria-checked={chevron ? undefined : selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left",
        selected
          ? "border-amber-300 bg-amber-50"
          : "border-lightGray bg-white hover:bg-lightGray/30"
      )}
    >
      <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-lightGray/50 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-primary">{label}</span>
        <span className="block truncate text-xs text-primaryGray">{sub}</span>
      </span>
      {chevron ? (
        <ChevronRightIcon className="h-5 w-5 text-primaryGray" />
      ) : (
        <span
          aria-hidden
          className={cn(
            "h-4 w-4 flex-none rounded-full border-2",
            selected
              ? "border-amber-600 bg-amber-600 shadow-[inset_0_0_0_2px_white]"
              : "border-primaryGray/50"
          )}
        />
      )}
    </button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create post"
      className="max-w-xl"
    >
      {view === "audience" ? (
        <>
          {header("Who can see this?", () => setView("form"))}
          <div
            role="radiogroup"
            aria-label="Who can see this?"
            className="flex flex-col gap-2 px-5 py-4"
          >
            {audienceOption({
              key: "church",
              icon: GlobeAltIcon,
              label: "Whole church",
              sub: "Everyone in WWM",
              selected: audience.kind === "CHURCH",
              onSelect: () => {
                setAudience(CHURCH);
                setView("form");
              },
            })}
            {departments.map((item) =>
              audienceOption({
                key: `dept-${item.id}`,
                icon: UserGroupIcon,
                label: departments.length > 1 ? item.name : "My department",
                sub: `${item.name} · ${plural(item.memberCount, "member")}`,
                selected:
                  audience.kind === "DEPARTMENT" &&
                  audience.departmentId === item.id,
                onSelect: () => {
                  setAudience({ kind: "DEPARTMENT", departmentId: item.id });
                  setView("form");
                },
              })
            )}
            {audienceOption({
              key: "selected",
              icon: UserPlusIcon,
              label: "Selected members",
              sub:
                audience.kind === "SELECTED"
                  ? audienceSummary.sub
                  : "Choose specific people",
              selected: audience.kind === "SELECTED",
              chevron: true,
              onSelect: () => {
                setDraftMembers(selectedMembers);
                setMemberQuery("");
                setView("members");
              },
            })}
            {audienceOption({
              key: "me",
              icon: LockClosedIcon,
              label: "Only me",
              sub: "Private · nobody else can see it",
              selected: audience.kind === "ONLY_ME",
              onSelect: () => {
                setAudience({ kind: "ONLY_ME" });
                setView("form");
              },
            })}
          </div>
        </>
      ) : view === "members" ? (
        <>
          {header("Select members", () => setView("audience"))}
          <div className="flex flex-col gap-3 px-5 py-4">
            <input
              type="search"
              autoFocus
              value={memberQuery}
              onChange={(event) => setMemberQuery(event.target.value)}
              placeholder="Search members by name"
              aria-label="Search members"
              className="w-full rounded-lg border border-lightGray bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none"
            />
            {draftMembers.length ? (
              <div className="flex flex-wrap gap-2">
                {draftMembers.map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
                  >
                    {member.name}
                    <button
                      type="button"
                      aria-label={`Remove ${member.name}`}
                      onClick={() =>
                        setDraftMembers((current) =>
                          current.filter((item) => item.id !== member.id)
                        )
                      }
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <ul className="max-h-72 overflow-y-auto">
              {memberResults.map((member) => {
                const checked = draftMembers.some((item) => item.id === member.id);
                return (
                  <li key={member.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2",
                        checked ? "bg-amber-50" : "hover:bg-lightGray/30"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setDraftMembers((current) =>
                            checked
                              ? current.filter((item) => item.id !== member.id)
                              : [...current, member]
                          )
                        }
                        className="h-4 w-4 accent-amber-600"
                      />
                      <CommunityAvatar person={member} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-primary">
                          {member.name}
                        </span>
                        {member.department ? (
                          <span className="block truncate text-xs text-primaryGray">
                            {member.department}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {memberQuery.trim() && !memberSearching && memberResults.length === 0 ? (
              <p className="text-center text-sm text-primaryGray">
                No members match “{memberQuery.trim()}”.
              </p>
            ) : null}
            {memberSearching ? (
              <p className="text-center text-sm text-primaryGray">Searching…</p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-lightGray px-5 py-4">
            <span className="text-sm text-primaryGray">
              {draftMembers.length
                ? `${plural(draftMembers.length, "member")} selected`
                : "No one selected"}
            </span>
            <button
              type="button"
              className={sheetPrimaryButton}
              disabled={!draftMembers.length}
              onClick={() => {
                setAudience({ kind: "SELECTED", members: draftMembers });
                setView("form");
              }}
            >
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          {header("Create post")}
          <div className="flex flex-col gap-5 overflow-y-auto px-5 py-4">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primaryGray">
                What are you sharing?
              </h3>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((option) => {
                  const meta = POST_TYPES[option];
                  const selected = type === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setType(option)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                        selected
                          ? cn(meta.pillClass, "font-semibold")
                          : "border-lightGray bg-white text-primaryGray hover:bg-lightGray/30"
                      )}
                    >
                      <span aria-hidden>{meta.emoji}</span>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {canManage ? (
              <label className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-primary">
                    Mark as important
                  </span>
                  <span className="block text-xs text-primaryGray">
                    Pinned at the top of the feed for 7 days and sent to
                    everyone in the audience.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(event) => setImportant(event.target.checked)}
                  className="h-5 w-5 accent-amber-600"
                />
              </label>
            ) : null}

            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={(type && CREATE_PLACEHOLDERS[type]) || DEFAULT_PLACEHOLDER}
              aria-label="Post text"
              rows={6}
              maxLength={5000}
              className="w-full resize-y rounded-xl border border-lightGray bg-white px-4 py-3 text-[15px] leading-6 text-primary focus:border-primary focus:outline-none"
            />

            <section>
              <div className="flex flex-wrap gap-2">
                {images.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative h-20 w-20 overflow-hidden rounded-lg border border-lightGray"
                  >
                    <img
                      src={src}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() =>
                        setImages((current) =>
                          current.filter((_, position) => position !== index)
                        )
                      }
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_POST_IMAGES ? (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-20 items-center gap-2 rounded-lg border border-dashed border-primaryGray/50 px-4 text-sm text-primaryGray hover:bg-lightGray/30 disabled:opacity-60"
                  >
                    <PhotoIcon className="h-5 w-5" />
                    {uploading
                      ? "Uploading…"
                      : images.length
                        ? "Add another"
                        : "Add photos"}
                  </button>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                onChange={(event) => addImages(event.target.files)}
              />
              <p className="mt-1 text-xs text-primaryGray">
                Up to {MAX_POST_IMAGES} photos.
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primaryGray">
                Who can see this?
              </h3>
              <button
                type="button"
                onClick={() => setView("audience")}
                className="flex w-full items-center gap-3 rounded-xl border border-lightGray bg-white px-4 py-3 text-left hover:bg-lightGray/30"
              >
                <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-lightGray/50 text-primary">
                  <audienceSummary.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-primary">
                    {audienceSummary.title}
                  </span>
                  <span className="block truncate text-xs text-primaryGray">
                    {audienceSummary.sub}
                  </span>
                </span>
                <span className="text-sm font-medium text-amber-700">Change</span>
              </button>
            </section>

            {showAnonymous ? (
              <section className="rounded-xl border border-lightGray px-4 py-3">
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium text-primary">
                      Post anonymously
                    </span>
                    <span className="block text-xs text-primaryGray">
                      Shows as: {isAnonymous ? "Anonymous" : viewerName || "You"}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={anonymous}
                    checked={anonymous}
                    onChange={(event) => setAnonymous(event.target.checked)}
                    className="h-5 w-5 accent-amber-600"
                  />
                </label>
                <p className="mt-2 text-xs text-primaryGray">
                  Your name and photo are hidden from other members. Church
                  administrators can still see who posted, for safety and
                  moderation.
                </p>
              </section>
            ) : null}
          </div>
          <div className="flex justify-end gap-3 border-t border-lightGray px-5 py-4">
            <button type="button" className={sheetSecondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={sheetPrimaryButton}
              disabled={!ready || submitting}
              onClick={publish}
            >
              {submitting ? "Posting…" : publishLabel}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};
