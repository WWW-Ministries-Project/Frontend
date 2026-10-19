import { useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type { Sermon, SermonSeries } from "@/utils/api/sermons/interfaces";

import PageOutline from "../../Components/PageOutline";
import {
  Field,
  FilterPanel,
  FilterToggleButton,
  PageHeading,
  Pill,
  PillTabs,
  SearchInput,
  SelectInput,
  TextArea,
  TextInput,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import { extractYouTubeVideoId, youtubeThumbnail } from "./utils/youtube";
import {
  ChipToggle,
  CommDialog,
  FieldGrid,
  FieldHint,
  FullRow,
  ListEmpty,
} from "./ui/commUi";
import {
  errorText,
  formatDay,
  plural,
  toIsoDay,
  todayIso,
} from "./ui/commUtils";

type Tab = "sermons" | "series";
interface Filters {
  series: string;
  tag: string;
  status: "" | "pub" | "draft";
}
const NO_FILTERS: Filters = { series: "", tag: "", status: "" };

interface SermonDraft {
  id: number | null;
  wasPublished: boolean;
  url: string;
  title: string;
  seriesId: string;
  date: string;
  tags: string[];
  newTag: string;
  description: string;
}

interface SeriesDraft {
  id: number | null;
  title: string;
  description: string;
}

const dayOf = (sermon: { preached_at?: string | null; published_at?: string | null; created_at: string }) =>
  toIsoDay(sermon.preached_at) || toIsoDay(sermon.published_at) || toIsoDay(sermon.created_at);

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const SermonManager = () => {
  const { hasPermission } = useAccessControl();
  const canManage = hasPermission("manage_sermons");

  const sermonsQuery = useFetch(api.fetch.fetchSermons, { take: 100 });
  const seriesQuery = useFetch(api.fetch.fetchSermonSeries, { take: 100 });
  const refetchAll = async () => {
    await Promise.all([sermonsQuery.refetch(), seriesQuery.refetch()]);
  };

  const [tab, setTab] = useState<Tab>("sermons");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sermonDraft, setSermonDraft] = useState<SermonDraft | null>(null);
  const [seriesDraft, setSeriesDraft] = useState<SeriesDraft | null>(null);
  const [tried, setTried] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const sermons = useMemo(() => (Array.isArray(sermonsQuery.data?.data) ? sermonsQuery.data.data : []), [sermonsQuery.data]);
  const series = useMemo(() => (Array.isArray(seriesQuery.data?.data) ? seriesQuery.data.data : []), [seriesQuery.data]);
  const tags = useMemo(
    () => Array.from(new Set(sermons.flatMap((sermon) => sermon.tags.map((tag) => tag.name)))).sort(),
    [sermons]
  );
  const today = todayIso();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sermons
      .filter(
        (sermon) =>
          (!filters.series ||
            (filters.series === "none" ? !sermon.series_id : String(sermon.series_id) === filters.series)) &&
          (!filters.tag || sermon.tags.some((tag) => tag.name === filters.tag)) &&
          (!filters.status || (filters.status === "pub") === (sermon.status === "PUBLISHED")) &&
          (!q || sermon.title.toLowerCase().includes(q))
      )
      .sort((a, b) => dayOf(b).localeCompare(dayOf(a)));
  }, [sermons, filters, query]);
  const filterCount = Object.values(filters).filter(Boolean).length;

  /* ------------------------------ sermon actions ------------------------------ */

  const togglePublish = async (sermon: Sermon) => {
    if (sermon.status === "PUBLISHED") {
      await api.post.unpublishSermon(sermon.id);
      await sermonsQuery.refetch();
      notify.success({
        title: "Sermon unpublished",
        message: "Hidden from members. It stays in drafts.",
        undo: async () => {
          await api.post.publishSermon(sermon.id);
          await sermonsQuery.refetch();
        },
        undoneTitle: "Sermon published again",
      });
      return;
    }
    await api.post.publishSermon(sermon.id);
    await sermonsQuery.refetch();
    notify.success({ title: "Sermon published", message: "Members can watch it now." });
  };

  const deleteSermon = (sermon: Sermon) =>
    confirmAction({
      title: `Delete “${sermon.title}”?`,
      points: ["It’s removed from the app and from its series.", "The YouTube video itself isn’t affected.", "This can’t be undone."],
      confirmLabel: "Delete sermon",
      cancelLabel: "Keep sermon",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deleteSermon(sermon.id);
        await refetchAll();
        notify.success({ title: "Sermon deleted", message: sermon.title });
      },
    });

  const openSermon = (sermon: Sermon | null, seriesId?: string) => {
    setSermonDraft(
      sermon
        ? {
            id: sermon.id,
            wasPublished: sermon.status === "PUBLISHED",
            url: sermon.youtube_url,
            title: sermon.title,
            seriesId: sermon.series_id ? String(sermon.series_id) : "",
            date: dayOf(sermon),
            tags: sermon.tags.map((tag) => tag.name),
            newTag: "",
            description: sermon.description ?? "",
          }
        : {
            id: null,
            wasPublished: false,
            url: "",
            title: "",
            seriesId: seriesId ?? (filters.series && filters.series !== "none" ? filters.series : ""),
            date: todayIso(),
            tags: [],
            newTag: "",
            description: "",
          }
    );
    setTried(false);
    setErrors([]);
  };
  const setSermonField = <K extends keyof SermonDraft>(key: K, value: SermonDraft[K]) =>
    setSermonDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const addTag = () =>
    setSermonDraft((prev) => {
      if (!prev || !prev.newTag.trim()) return prev;
      return { ...prev, tags: Array.from(new Set([...prev.tags, prev.newTag.trim()])), newTag: "" };
    });

  const saveSermon = async (publish: boolean) => {
    if (!sermonDraft) return;
    setTried(true);
    const list: string[] = [];
    if (!extractYouTubeVideoId(sermonDraft.url))
      list.push(
        sermonDraft.url.trim()
          ? "That link isn’t a YouTube video. Copy the link from the video’s Share button."
          : "Paste the YouTube link."
      );
    if (!sermonDraft.title.trim()) list.push("Give the sermon a title.");
    setErrors(list);
    if (list.length) return;

    const pendingTag = sermonDraft.newTag.trim();
    const payload = {
      title: sermonDraft.title.trim(),
      youtube_url: sermonDraft.url.trim(),
      description: sermonDraft.description.trim() || null,
      series_id: sermonDraft.seriesId ? Number(sermonDraft.seriesId) : null,
      tags: pendingTag ? Array.from(new Set([...sermonDraft.tags, pendingTag])) : sermonDraft.tags,
      preached_at: sermonDraft.date || null,
    };

    setSaving(true);
    try {
      const response = sermonDraft.id
        ? await api.put.updateSermon(sermonDraft.id, payload)
        : await api.post.createSermon(payload);
      const saved = response.data;
      const publishNow = publish && saved && saved.status !== "PUBLISHED";
      if (publishNow) await api.post.publishSermon(saved.id);
      setSermonDraft(null);
      await refetchAll();
      const isPublished = publishNow || sermonDraft.wasPublished;
      notify.success({
        title: isPublished ? (publishNow ? "Sermon published" : "Sermon updated") : "Draft saved",
        message: isPublished
          ? `${payload.title} is in the app’s Sermons tab.`
          : `${payload.title} isn’t visible to members yet.`,
      });
    } catch (error) {
      setErrors([errorText(error, "The sermon wasn't saved. Try again.")]);
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------ series actions ------------------------------ */

  const openSeries = (item: SermonSeries | null) => {
    setSeriesDraft(item ? { id: item.id, title: item.title, description: item.description ?? "" } : { id: null, title: "", description: "" });
    setTried(false);
    setErrors([]);
  };

  const saveSeries = async () => {
    if (!seriesDraft) return;
    setTried(true);
    if (!seriesDraft.title.trim()) {
      setErrors(["Give the series a title."]);
      return;
    }
    const payload = { title: seriesDraft.title.trim(), description: seriesDraft.description.trim() || null };
    setSaving(true);
    try {
      const response = seriesDraft.id
        ? await api.put.updateSermonSeries(seriesDraft.id, payload)
        : await api.post.createSermonSeries(payload);
      const created = !seriesDraft.id ? response.data : null;
      setSeriesDraft(null);
      await seriesQuery.refetch();
      notify.success({
        title: seriesDraft.id ? "Series updated" : "Series created",
        message: payload.title,
        action: created ? { label: "Add a sermon", onClick: () => openSermon(null, String(created.id)) } : undefined,
      });
    } catch (error) {
      setErrors([errorText(error, "The series wasn't saved. Try again.")]);
    } finally {
      setSaving(false);
    }
  };

  const deleteSeries = (item: SermonSeries, count: number) =>
    confirmAction({
      title: `Delete the “${item.title}” series?`,
      points: [
        count ? `Its ${plural(count, "sermon")} ${count > 1 ? "stay" : "stays"} in the app, without a series.` : "It has no sermons.",
        "This can’t be undone.",
      ],
      confirmLabel: "Delete series",
      cancelLabel: "Keep series",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deleteSermonSeries(item.id);
        await refetchAll();
        notify.success({ title: "Series deleted", message: item.title });
      },
    });

  /* ---------------------------------- render ---------------------------------- */

  const videoId = sermonDraft ? extractYouTubeVideoId(sermonDraft.url) : null;
  const dialogTags = sermonDraft ? Array.from(new Set([...tags, ...sermonDraft.tags])).sort() : [];
  const loading = sermonsQuery.loading || seriesQuery.loading;

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Sermons"
        subtitle="YouTube sermons members watch in the app, grouped into series."
        actions={
          canManage ? (
            <>
              <UiButton onClick={() => openSeries(null)}>New series</UiButton>
              <UiButton tone="primary" onClick={() => openSermon(null)}>
                Add sermon
              </UiButton>
            </>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          ariaLabel="Sermons or series"
          tabs={[
            { key: "sermons", label: "Sermons", count: sermons.length },
            { key: "series", label: "Series", count: series.length },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "sermons" && (
          <FilterToggleButton open={showFilters} count={filterCount} onClick={() => setShowFilters((prev) => !prev)} />
        )}
      </div>

      {tab === "sermons" && (
        <>
          {showFilters && (
            <FilterPanel
              title="Refine sermons"
              helper="Combine with the search below."
              onReset={() => setFilters(NO_FILTERS)}
              resetDisabled={filterCount === 0}
            >
              <Field label="Series">
                <SelectInput
                  value={filters.series}
                  onChange={(event) => setFilters({ ...filters, series: event.target.value })}
                  options={[
                    { value: "", label: "All series" },
                    ...series.map((item) => ({ value: String(item.id), label: item.title })),
                    { value: "none", label: "Not in a series" },
                  ]}
                />
              </Field>
              <Field label="Tag">
                <SelectInput
                  value={filters.tag}
                  onChange={(event) => setFilters({ ...filters, tag: event.target.value })}
                  options={[{ value: "", label: "All tags" }, ...tags.map((tag) => ({ value: tag, label: tag }))]}
                />
              </Field>
              <Field label="Status">
                <SelectInput
                  value={filters.status}
                  onChange={(event) => setFilters({ ...filters, status: event.target.value as Filters["status"] })}
                  options={[
                    { value: "", label: "Any status" },
                    { value: "pub", label: "Published" },
                    { value: "draft", label: "Draft" },
                  ]}
                />
              </Field>
            </FilterPanel>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search sermons"
              ariaLabel="Search sermons"
              className="max-w-[420px]"
            />
            <p className="text-sm text-[#4B5563]">
              {filtered.length} of {plural(sermons.length, "sermon")}
            </p>
          </div>

          {loading && sermons.length === 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-xl bg-[#F3F4F6]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <ListEmpty>
              {sermons.length ? "No sermons match. Clear a filter to see more." : "No sermons yet. Add the first one from YouTube."}
            </ListEmpty>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
              {filtered.map((sermon) => {
                const day = dayOf(sermon);
                const published = sermon.status === "PUBLISHED";
                const thumb = sermon.thumbnail_url || youtubeThumbnail(sermon.video_id);
                return (
                  <div
                    key={sermon.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-lightGray bg-white transition-shadow hover:shadow-[0_10px_28px_rgba(8,13,45,0.2)]"
                  >
                    <a
                      href={sermon.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Watch ${sermon.title} on YouTube`}
                      className="relative flex aspect-video items-center justify-center bg-[#1F2937]"
                    >
                      {thumb && <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-black/40">
                        <PlayIcon />
                      </span>
                      <span className="absolute left-3 top-3">
                        {published ? <Pill tone="success">Published</Pill> : <Pill tone="neutral">Draft</Pill>}
                      </span>
                    </a>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <p className="line-clamp-2 text-base font-semibold text-primary">{sermon.title}</p>
                      <p className="text-xs text-[#6B7280]">
                        {[sermon.series?.title, day > today ? `Planned for ${formatDay(day)}` : formatDay(day)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {sermon.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {sermon.tags.map((tag) => (
                            <span key={tag.id} className="rounded-full bg-[#F3F4F6] px-2 text-xs text-[#374151]">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {canManage && (
                        <div className="mt-auto flex flex-wrap gap-2 pt-2">
                          <UiButton
                            size="sm"
                            tone={published ? "ghost" : "primary"}
                            className={published ? "text-primary hover:bg-primary/5" : "px-3"}
                            onClick={() => togglePublish(sermon)}
                          >
                            {published ? "Unpublish" : "Publish"}
                          </UiButton>
                          <UiButton size="sm" onClick={() => openSermon(sermon)}>
                            Edit
                          </UiButton>
                          <UiButton size="sm" tone="danger" onClick={() => deleteSermon(sermon)}>
                            Delete
                          </UiButton>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "series" &&
        (series.length === 0 ? (
          <ListEmpty>No series yet. Group related sermons so members can watch them in order.</ListEmpty>
        ) : (
          <div className="flex flex-col gap-4">
            {series.map((item) => {
              const items = [...(item.sermons ?? [])].sort((a, b) => dayOf(a).localeCompare(dayOf(b)));
              const published = items.filter((sermon) => sermon.status === "PUBLISHED").length;
              const cover = items.map((sermon) => sermon.thumbnail_url).find(Boolean);
              return (
                <div key={item.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-lightGray bg-white p-5">
                  <div className="aspect-video w-[120px] flex-none overflow-hidden rounded-lg bg-[#1F2937]">
                    {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
                    <p className="text-base font-semibold text-primary">{item.title}</p>
                    {item.description && <p className="text-sm text-[#4B5563]">{item.description}</p>}
                    <p className="text-xs text-[#6B7280]">
                      {items.length
                        ? `${plural(items.length, "sermon")} · ${published} published · ${formatDay(dayOf(items[0]))} – ${formatDay(dayOf(items[items.length - 1]))}`
                        : "No sermons yet"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <UiButton
                      size="sm"
                      onClick={() => {
                        setTab("sermons");
                        setFilters({ ...NO_FILTERS, series: String(item.id) });
                        setShowFilters(true);
                      }}
                    >
                      View sermons
                    </UiButton>
                    {canManage && (
                      <>
                        <UiButton size="sm" onClick={() => openSeries(item)}>
                          Edit
                        </UiButton>
                        <UiButton size="sm" tone="danger" onClick={() => deleteSeries(item, items.length)}>
                          Delete
                        </UiButton>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {sermonDraft && (
        <CommDialog
          open
          onClose={() => setSermonDraft(null)}
          busy={saving}
          title={sermonDraft.id ? "Edit sermon" : "Add sermon"}
          subtitle="Paste the YouTube link first. Members watch it in the app’s Sermons tab."
          errors={errors}
          buttons={[
            { label: "Cancel", onClick: () => setSermonDraft(null) },
            ...(sermonDraft.newTag.trim() ? [{ label: "Add tag", onClick: addTag }] : []),
            ...(sermonDraft.wasPublished
              ? [{ label: "Save changes", onClick: () => saveSermon(false), tone: "primary" as const }]
              : [
                  { label: "Save draft", onClick: () => saveSermon(false) },
                  { label: "Publish", onClick: () => saveSermon(true), tone: "primary" as const },
                ]),
          ]}
        >
          {videoId && (
            <img
              src={youtubeThumbnail(videoId) ?? undefined}
              alt=""
              className="aspect-video max-h-60 w-full rounded-xl bg-[#1F2937] object-cover"
            />
          )}
          <FieldGrid>
            <Field label="YouTube link *">
              <TextInput
                type="url"
                value={sermonDraft.url}
                onChange={(event) => setSermonField("url", event.target.value)}
                placeholder="https://youtu.be/…"
                maxLength={200}
                hasError={tried && !videoId}
              />
              <FieldHint tone={sermonDraft.url && !videoId ? "error" : "muted"}>
                {sermonDraft.url
                  ? videoId
                    ? `Video found · ID ${videoId}`
                    : "This isn’t a link to a single YouTube video."
                  : "From the video’s Share button."}
              </FieldHint>
            </Field>
            <Field label="Title *">
              <TextInput
                value={sermonDraft.title}
                onChange={(event) => setSermonField("title", event.target.value)}
                placeholder="Lengthen your cords"
                maxLength={120}
                hasError={tried && !sermonDraft.title.trim()}
              />
            </Field>
            <Field label="Series">
              <SelectInput
                value={sermonDraft.seriesId}
                onChange={(event) => setSermonField("seriesId", event.target.value)}
                options={[
                  { value: "", label: "Not in a series" },
                  ...series.map((item) => ({ value: String(item.id), label: item.title })),
                ]}
              />
              <FieldHint>Create series from the Sermons page.</FieldHint>
            </Field>
            <Field label="Date preached">
              <TextInput type="date" value={sermonDraft.date} onChange={(event) => setSermonField("date", event.target.value)} />
            </Field>
            {dialogTags.length > 0 && (
              <FullRow>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-primary">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {dialogTags.map((tag) => {
                      const on = sermonDraft.tags.includes(tag);
                      return (
                        <ChipToggle
                          key={tag}
                          on={on}
                          onClick={() =>
                            setSermonField("tags", on ? sermonDraft.tags.filter((item) => item !== tag) : [...sermonDraft.tags, tag])
                          }
                        >
                          {tag}
                        </ChipToggle>
                      );
                    })}
                  </div>
                </div>
              </FullRow>
            )}
            <Field label="Add a tag">
              <TextInput
                value={sermonDraft.newTag}
                onChange={(event) => setSermonField("newTag", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Type and press Enter"
                maxLength={24}
              />
            </Field>
            <FullRow>
              <Field label="Description">
                <TextArea
                  value={sermonDraft.description}
                  onChange={(event) => setSermonField("description", event.target.value)}
                  placeholder="Optional summary shown under the video"
                  maxLength={1000}
                />
              </Field>
            </FullRow>
          </FieldGrid>
        </CommDialog>
      )}

      {seriesDraft && (
        <CommDialog
          open
          onClose={() => setSeriesDraft(null)}
          busy={saving}
          title={seriesDraft.id ? "Edit series" : "New series"}
          subtitle="Groups related sermons together in the app."
          errors={errors}
          buttons={[
            { label: "Cancel", onClick: () => setSeriesDraft(null) },
            { label: seriesDraft.id ? "Save changes" : "Create series", onClick: saveSeries, tone: "primary" },
          ]}
        >
          <Field label="Title *">
            <TextInput
              value={seriesDraft.title}
              onChange={(event) => setSeriesDraft({ ...seriesDraft, title: event.target.value })}
              placeholder="Enlarge Your Tent"
              maxLength={80}
              hasError={tried && !seriesDraft.title.trim()}
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={seriesDraft.description}
              onChange={(event) => setSeriesDraft({ ...seriesDraft, description: event.target.value })}
              maxLength={500}
            />
          </Field>
        </CommDialog>
      )}
    </PageOutline>
  );
};

export default SermonManager;
