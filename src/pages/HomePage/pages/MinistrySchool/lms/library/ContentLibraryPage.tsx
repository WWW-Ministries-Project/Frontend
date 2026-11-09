import { pictureInstance } from "@/axiosInstance";
import { Modal } from "@/components/Modal";
import { useSomAccess } from "../../utils/useSomAccess";
import { STALE, useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type {
  LibraryItem,
  LibraryItemPayload,
  LibraryType,
} from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { validateUploadFile } from "@/utils/uploadValidation";
import { ChangeEvent, useMemo, useState } from "react";
import { runAction } from "../runAction";
import { fmtDate, safeHttpUrl } from "../somUtils";
import {
  Btn,
  EmptyBlock,
  FilterChips,
  KebabMenu,
  LoadError,
  PageHeader,
  Pill,
  Thumbnail,
  type ChipOption,
  type Tone,
} from "../ui";

const TYPE_LABEL: Record<LibraryType, string> = {
  VIDEO: "Video",
  PDF: "PDF",
  SLIDES: "Slides",
  DOCUMENT: "Document",
  LINK: "Link",
  IMAGE: "Image",
};
const TYPE_TONE: Record<LibraryType, Tone> = {
  VIDEO: "cyan",
  PDF: "red",
  SLIDES: "orange",
  DOCUMENT: "gray",
  LINK: "indigo",
  IMAGE: "green",
};
const TYPES = Object.keys(TYPE_LABEL) as LibraryType[];

/** Small glyph shown in the card thumbnail per content type. */
const TypeGlyph = ({ type }: { type: LibraryType }) => {
  const common = {
    width: 30,
    height: 30,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (type) {
    case "VIDEO":
      return (
        <svg {...common}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case "IMAGE":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      );
    case "LINK":
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      );
  }
};

const UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
// The shared /upload endpoint does not accept PowerPoint; add slides as a link (e.g. Google Slides, OneDrive).
const UPLOAD_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp", "gif"];
const UPLOAD_ACCEPT = `${UPLOAD_EXTENSIONS.map((e) => `.${e}`).join(",")},${UPLOAD_MIME_TYPES.join(",")}`;

const extensionOf = (value: string) => {
  const clean = value.split(/[?#]/)[0].toLowerCase();
  const dot = clean.lastIndexOf(".");
  return dot >= 0 && dot > clean.lastIndexOf("/") ? clean.slice(dot + 1) : "";
};

/** Best guess of the library type from a file name / URL and optional MIME type. */
const detectType = (source: string, mime = ""): LibraryType => {
  const lower = source.toLowerCase();
  const ext = extensionOf(lower);
  if (/(youtube\.com|youtu\.be|vimeo\.com)/.test(lower) || mime.startsWith("video/") || ["mp4", "webm", "mov", "m4v"].includes(ext))
    return "VIDEO";
  if (mime === "application/pdf" || ext === "pdf") return "PDF";
  if (mime.includes("powerpoint") || mime.includes("presentationml") || ext === "ppt" || ext === "pptx") return "SLIDES";
  if (mime.includes("msword") || mime.includes("wordprocessingml") || ext === "doc" || ext === "docx") return "DOCUMENT";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return "IMAGE";
  return "LINK";
};

const fmtSize = (bytes: number | null) => {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const itemMeta = (item: LibraryItem) =>
  [
    item.type === "VIDEO" && item.duration_minutes ? `${item.duration_minutes} min` : null,
    (item.type === "PDF" || item.type === "SLIDES") && item.pages ? `${item.pages} pages` : null,
    fmtSize(item.size_bytes),
  ]
    .filter(Boolean)
    .join(" · ");

const titleFromFile = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

const field = "h-10 w-full rounded-lg border border-lightGray bg-inputBackground px-3 text-sm text-primary";

type Mode = "upload" | "link";
type Draft = {
  id?: number;
  mode: Mode;
  title: string;
  type: LibraryType;
  typeTouched: boolean;
  url: string;
  fileName: string;
  size_bytes: number | null;
  duration: string;
  pages: string;
  tags: string;
  originalUrl: string;
  usedBy: number;
};

const emptyDraft = (): Draft => ({
  mode: "upload",
  title: "",
  type: "LINK",
  typeTouched: false,
  url: "",
  fileName: "",
  size_bytes: null,
  duration: "",
  pages: "",
  tags: "",
  originalUrl: "",
  usedBy: 0,
});

const draftFrom = (item: LibraryItem): Draft => ({
  id: item.id,
  mode: "link",
  title: item.title,
  type: item.type,
  typeTouched: true,
  url: item.url,
  fileName: "",
  size_bytes: item.size_bytes,
  duration: item.duration_minutes ? String(item.duration_minutes) : "",
  pages: item.pages ? String(item.pages) : "",
  tags: (item.tags ?? []).join(", "),
  originalUrl: item.url,
  usedBy: item.usedBy,
});

const positiveIntOrNull = (value: string) => {
  const n = Number(value);
  return value.trim() && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

const LibraryEditor = ({
  initial,
  onClose,
  onSaved,
}: {
  initial: Draft;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [draft, setDraft] = useState<Draft>(initial);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const patch = (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next }));

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ext = extensionOf(file.name);
    const knownByExtension = !file.type && UPLOAD_EXTENSIONS.includes(ext);
    const validation = validateUploadFile(file, {
      allowedMimeTypes: knownByExtension ? [file.type] : UPLOAD_MIME_TYPES,
      invalidTypeMessage: "Unsupported file. Upload a PDF, Word document or image. Add slides as a link.",
    });
    if (!validation.valid) {
      showNotification(validation.message || "Invalid file selected.", "error", "Upload");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploading(0);
    let link: string | null = null;
    const ok = await runAction(
      async () => {
        const response = await pictureInstance.post("/upload", formData, {
          onUploadProgress: (event) => {
            if (event.total) setUploading(Math.round((event.loaded / event.total) * 100));
          },
        });
        link = (response.data as { result?: { link?: string } })?.result?.link ?? null;
        if (!link) throw new Error("The upload did not return a link");
      },
      { failure: "Could not upload the file" }
    );
    setUploading(null);
    if (!ok || !link) return;
    const uploaded: string = link;
    setDraft((d) => ({
      ...d,
      url: uploaded,
      fileName: file.name,
      size_bytes: file.size,
      title: d.title.trim() ? d.title : titleFromFile(file.name),
      type: d.typeTouched ? d.type : detectType(file.name, file.type),
    }));
  };

  const onUrl = (value: string) =>
    setDraft((d) => ({
      ...d,
      url: value,
      fileName: "",
      size_bytes: value === d.originalUrl ? initial.size_bytes : null,
      type: d.typeTouched ? d.type : detectType(value),
    }));

  const validUrl = safeHttpUrl(draft.url.trim());
  const urlChanged = Boolean(draft.id) && draft.url.trim() !== draft.originalUrl;
  const canSave = Boolean(draft.title.trim() && validUrl) && uploading === null && !saving;

  const save = async () => {
    if (!validUrl) return;
    const payload: LibraryItemPayload = {
      title: draft.title.trim(),
      type: draft.type,
      url: validUrl,
      size_bytes: draft.size_bytes,
      duration_minutes: draft.type === "VIDEO" ? positiveIntOrNull(draft.duration) : null,
      pages: draft.type === "PDF" || draft.type === "SLIDES" ? positiveIntOrNull(draft.pages) : null,
      tags: draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    setSaving(true);
    let unitsUpdated = 0;
    const id = draft.id;
    const ok = await runAction(
      async () => {
        if (id) {
          const res = await api.put.updateLibraryItem(payload, { id: String(id) });
          unitsUpdated = res?.data?.unitsUpdated ?? 0;
        } else {
          await api.post.createLibraryItem(payload);
        }
      },
      { failure: "Could not save the item" }
    );
    setSaving(false);
    if (!ok) return;
    showNotification(
      id
        ? unitsUpdated > 0
          ? `Saved. Updated ${unitsUpdated} unit${unitsUpdated === 1 ? "" : "s"} that use${unitsUpdated === 1 ? "s" : ""} it.`
          : "Library item updated"
        : "Added to the library",
      "success"
    );
    onSaved();
  };

  return (
    <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5">
      <h3 className="text-lg font-semibold text-primary">{draft.id ? "Edit content" : "Add content"}</h3>

      <div role="tablist" aria-label="How to add content" className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["upload", "link"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={draft.mode === m}
            onClick={() => patch({ mode: m })}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm",
              draft.mode === m ? "bg-white font-semibold text-primary shadow-sm" : "text-primaryGray hover:text-primary"
            )}
          >
            {m === "upload" ? "Upload a file" : "Add a link"}
          </button>
        ))}
      </div>

      {draft.mode === "upload" ? (
        <div className="flex flex-col gap-1.5 text-sm">
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-lightGray px-4 py-6 text-center focus-within:ring-2 focus-within:ring-primary">
            <span className="font-medium text-primary">
              {uploading !== null ? `Uploading… ${uploading}%` : draft.fileName || "Choose a file"}
            </span>
            <span className="text-xs text-mainGray">PDF, Word or image · up to 5 MB. Add videos and slides as a link.</span>
            <input
              type="file"
              accept={UPLOAD_ACCEPT}
              className="sr-only"
              disabled={uploading !== null}
              onChange={onFile}
              aria-label="File to upload"
            />
          </label>
          {draft.url && uploading === null && !draft.fileName && (
            <p className="truncate text-xs text-mainGray">Current file: {draft.url}</p>
          )}
        </div>
      ) : (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-primary">Link</span>
          <input
            type="url"
            inputMode="url"
            className={field}
            placeholder="https://youtube.com/watch?v=… or https://…/file.pdf"
            value={draft.url}
            onChange={(e) => onUrl(e.target.value)}
          />
          {draft.url.trim() && !validUrl && <span className="text-xs text-red-700">Enter a full http(s) link.</span>}
        </label>
      )}

      {urlChanged && draft.usedBy > 0 && (
        <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {draft.usedBy} unit{draft.usedBy === 1 ? " uses" : "s use"} this. They will switch to the new link.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-primary">Title</span>
        <input className={field} value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
      </label>

      <div className="grid gap-3 tablet:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-primary">Type</span>
          <select
            className={field}
            value={draft.type}
            onChange={(e) => patch({ type: e.target.value as LibraryType, typeTouched: true })}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        {draft.type === "VIDEO" && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-primary">Duration (minutes, optional)</span>
            <input
              type="number"
              min={1}
              className={field}
              value={draft.duration}
              onChange={(e) => patch({ duration: e.target.value })}
            />
          </label>
        )}
        {(draft.type === "PDF" || draft.type === "SLIDES") && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-primary">Pages (optional)</span>
            <input
              type="number"
              min={1}
              className={field}
              value={draft.pages}
              onChange={(e) => patch({ pages: e.target.value })}
            />
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-primary">Tags (comma separated)</span>
        <input
          className={field}
          value={draft.tags}
          placeholder="Leadership, Module 1"
          onChange={(e) => patch({ tags: e.target.value })}
        />
      </label>

      <div className="flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" disabled={!canSave} onClick={save}>
          {saving ? "Saving…" : draft.id ? "Save changes" : "Add to library"}
        </Btn>
      </div>
    </div>
  );
};

/** Shared files and videos reused as units across School of Ministry programs. */
export const ContentLibraryPage = () => {
  // Shared by every program: whole-school designers only.
  const canManage = useSomAccess().canAll("design_curriculum");
  const { data, loading, error, refetch } = useFetch(api.fetch.fetchContentLibrary, undefined, !canManage, { staleTime: STALE.reference });
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState(""); // applied term the filter below reads
  const [type, setType] = useState<LibraryType | "">("");
  const [tag, setTag] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);

  const all = useMemo(() => data?.data ?? [], [data]);
  const tags = useMemo(() => Array.from(new Set(all.flatMap((i) => i.tags ?? []))).sort(), [all]);
  const typeOptions = useMemo<ChipOption<LibraryType | "">[]>(() => {
    const counts = new Map<LibraryType, number>();
    all.forEach((i) => counts.set(i.type, (counts.get(i.type) ?? 0) + 1));
    return [
      { value: "", label: "All", count: all.length },
      ...TYPES.filter((t) => counts.has(t)).map((t) => ({
        value: t,
        label: TYPE_LABEL[t],
        count: counts.get(t),
      })),
    ];
  }, [all]);
  const term = search.trim().toLowerCase();
  const rows = all.filter(
    (i) =>
      (!type || i.type === type) &&
      (!tag || (i.tags ?? []).includes(tag)) &&
      (!term || i.title.toLowerCase().includes(term) || (i.tags ?? []).some((t) => t.toLowerCase().includes(term)))
  );

  const remove = (item: LibraryItem) =>
    showDeleteDialog({ name: item.title, id: item.id }, async () => {
      const ok = await runAction(() => api.delete.deleteLibraryItem({ id: String(item.id) }), {
        success: "Removed from the library. Units that used it keep their content.",
        failure: "Could not delete the item",
      });
      if (ok) refetch();
    });

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Content library"
          subtitle="Files and videos shared across programs. Edit once — every unit that uses it updates."
          actions={
            canManage ? (
              <Btn variant="primary" onClick={() => setEditing(emptyDraft())}>
                + Add content
              </Btn>
            ) : undefined
          }
        />

        {!canManage ? (
          <EmptyBlock msg="The content library is available to School of Ministry managers." />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <form
                  role="search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSearch(searchDraft.trim());
                  }}
                  className="flex w-full tablet:w-auto"
                >
                  <input
                    type="search"
                    aria-label="Search content"
                    placeholder="Search title or tag"
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    className="h-9 w-full rounded-l-lg border border-lightGray bg-white px-3 text-sm tablet:w-56"
                  />
                  <button
                    type="submit"
                    className="h-9 flex-shrink-0 rounded-r-lg bg-primary px-4 text-sm font-semibold text-white"
                  >
                    Search
                  </button>
                </form>
                <select
                  aria-label="Tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="h-9 rounded-lg border border-lightGray bg-white px-2 text-sm"
                >
                  <option value="">All tags</option>
                  {tags.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <FilterChips<LibraryType | "">
                options={typeOptions}
                value={type}
                onChange={setType}
              />
            </div>

            {error && !data ? (
              <LoadError msg="Could not load the content library." onRetry={() => refetch()} />
            ) : loading && !data ? (
              <SkeletonLoader no={3} />
            ) : rows.length === 0 ? (
              <EmptyBlock
                msg={
                  all.length
                    ? "No content matches these filters."
                    : "The library is empty. Add files and videos to reuse them across programs."
                }
              />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                {rows.map((i) => {
                  const meta = itemMeta(i);
                  const href = safeHttpUrl(i.url);
                  return (
                    <div
                      key={i.id}
                      className="flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-3 transition hover:shadow-md"
                    >
                      <Thumbnail
                        badge={<Pill tone={TYPE_TONE[i.type]}>{TYPE_LABEL[i.type]}</Pill>}
                        icon={<TypeGlyph type={i.type} />}
                      />
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-col">
                          <span className="line-clamp-2 font-semibold text-primary">{i.title}</span>
                          <span className="text-xs text-mainGray">
                            {meta ? `${meta} · ` : ""}updated {fmtDate(i.updatedAt)}
                          </span>
                        </div>
                        <KebabMenu
                          label={`Actions for ${i.title}`}
                          actions={[
                            { label: "Edit", onClick: () => setEditing(draftFrom(i)) },
                            { label: "Delete", danger: true, onClick: () => remove(i) },
                          ]}
                        />
                      </div>
                      {(i.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(i.tags ?? []).map((t) => (
                            <Pill key={t} tone="gray">
                              {t}
                            </Pill>
                          ))}
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                        <span className={cn("text-xs", !i.usedBy && "text-mainGray")}>
                          {i.usedBy ? `Used in ${i.usedBy} unit${i.usedBy === 1 ? "" : "s"}` : "Not used"}
                          {i.usedInPrograms != null && i.usedInPrograms > 0 && ` · ${i.usedInPrograms} program${i.usedInPrograms === 1 ? "" : "s"}`}
                        </span>
                        {href && (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${i.title} in a new tab`}
                            className="inline-flex h-8 items-center rounded-lg border border-lightGray bg-white px-3 text-sm font-medium text-primary hover:bg-gray-50"
                          >
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} className="!max-w-lg" title="Library content">
        {editing && (
          <LibraryEditor
            key={editing.id ?? "new"}
            initial={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refetch();
            }}
          />
        )}
      </Modal>
    </PageOutline>
  );
};

export default ContentLibraryPage;
