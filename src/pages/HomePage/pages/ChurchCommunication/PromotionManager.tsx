import { useMemo, useState } from "react";

import { InlineAlert, notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePictureUpload } from "@/CustomHooks/usePictureUpload";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type { CreatePromotionDto, Promotion } from "@/utils/api/promotions/interfaces";

import PageOutline from "../../Components/PageOutline";
import {
  Field,
  PageHeading,
  Pill,
  PillTabs,
  SelectInput,
  TextInput,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import {
  PROMOTION_APP_SCREENS,
  WEB_LINK_PATTERN,
  describePromotionLink,
  parsePromotionLink,
  type PromotionLinkType,
} from "./Components/promotionLinks";
import {
  BannerPreview,
  ChoiceButtons,
  CommDialog,
  FieldGrid,
  FieldHint,
  FullRow,
  ImageDropField,
  ListEmpty,
} from "./ui/commUi";
import {
  errorText,
  formatDay,
  toIsoDay,
  todayIso,
} from "./ui/commUtils";

type PromoState = "live" | "scheduled" | "draft" | "ended";

/** Only this many live promotions show on the app's Home screen. */
const HOME_SLOTS = 3;

const stateOf = (promotion: Promotion, today: string): PromoState => {
  if (promotion.status !== "PUBLISHED") return "draft";
  const end = toIsoDay(promotion.end_date);
  const start = toIsoDay(promotion.start_date);
  if (end && end < today) return "ended";
  if (start && start > today) return "scheduled";
  return "live";
};

const byOrder = (a: Promotion, b: Promotion) =>
  (a.sort_order ?? 99) - (b.sort_order ?? 99) ||
  toIsoDay(a.start_date).localeCompare(toIsoDay(b.start_date));

interface PromoDraft {
  id: number | null;
  wasPublished: boolean;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  linkType: PromotionLinkType;
  screen: string;
  web: string;
  cta: string;
  start: string;
  end: string;
  order: string;
}

const toDraft = (promotion: Promotion | null): PromoDraft => {
  if (!promotion) {
    return {
      id: null,
      wasPublished: false,
      title: "",
      subtitle: "",
      imageUrl: null,
      linkType: "screen",
      screen: "",
      web: "",
      cta: "",
      start: todayIso(),
      end: "",
      order: "",
    };
  }
  const link = parsePromotionLink(promotion.deep_link);
  return {
    id: promotion.id,
    wasPublished: promotion.status === "PUBLISHED",
    title: promotion.title,
    subtitle: promotion.subtitle ?? "",
    imageUrl: promotion.image_url,
    linkType: link.type,
    screen: link.screen,
    web: link.url,
    cta: promotion.cta_label ?? "",
    start: toIsoDay(promotion.start_date),
    end: toIsoDay(promotion.end_date),
    order: promotion.sort_order == null ? "" : String(promotion.sort_order),
  };
};

const TABS: { key: PromoState; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "scheduled", label: "Scheduled" },
  { key: "draft", label: "Drafts" },
  { key: "ended", label: "Ended" },
];

const EMPTY_TEXT: Record<PromoState, string> = {
  live: "Nothing is live. Publish a draft or create a promotion.",
  scheduled: "Nothing scheduled. Set a future start date to queue a promotion.",
  draft: "No drafts.",
  ended: "No ended promotions.",
};

const PromotionManager = () => {
  const { hasAction } = useAccessControl();
  const canManage = hasAction("Promotions.create");
  const canPublish = hasAction("Promotions.publish");
  const canReorder = hasAction("Promotions.reorder");
  const canDelete = hasAction("Promotions.delete");
  const { data, loading, refetch } = useFetch(api.fetch.fetchPromotions, { take: 100 });
  const { handleUpload, loading: uploading } = usePictureUpload();

  const [tab, setTab] = useState<PromoState>("live");
  const [draft, setDraft] = useState<PromoDraft | null>(null);
  const [tried, setTried] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  const today = todayIso();
  const promotions = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);
  const groups = useMemo(() => {
    const out: Record<PromoState, Promotion[]> = { live: [], scheduled: [], draft: [], ended: [] };
    promotions.forEach((promotion) => out[stateOf(promotion, today)].push(promotion));
    out.live.sort(byOrder);
    (["scheduled", "draft", "ended"] as const).forEach((key) =>
      out[key].sort((a, b) => toIsoDay(b.start_date).localeCompare(toIsoDay(a.start_date)))
    );
    return out;
  }, [promotions, today]);
  const live = groups.live;
  const list = groups[tab];

  /* ------------------------------ actions ------------------------------ */

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= live.length || reordering) return;
    const ids = live.map((promotion) => promotion.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setReordering(true);
    try {
      await api.post.reorderPromotions(ids);
      await refetch();
    } finally {
      setReordering(false);
    }
  };

  const setPublished = async (promotion: Promotion, on: boolean) => {
    if (on) {
      await api.post.publishPromotion(promotion.id);
      await refetch();
      const state = stateOf({ ...promotion, status: "PUBLISHED" }, today);
      notify.success({
        title: "Published",
        message: state === "live" ? "Now on the Home screen." : `Goes live on ${formatDay(promotion.start_date)}.`,
      });
      return;
    }
    await api.post.unpublishPromotion(promotion.id);
    await refetch();
    notify.success({
      title: "Unpublished",
      message: `${promotion.title} is back in drafts.`,
      undo: async () => {
        await api.post.publishPromotion(promotion.id);
        await refetch();
      },
      undoneTitle: "Published again",
    });
  };

  const remove = (promotion: Promotion) =>
    confirmAction({
      title: `Delete “${promotion.title}”?`,
      points: [
        stateOf(promotion, today) === "live"
          ? "It disappears from the Home screen immediately."
          : "Members never saw it, or it has already ended.",
        "This can’t be undone. Unpublish instead if you may reuse it.",
      ],
      confirmLabel: "Delete promotion",
      cancelLabel: "Keep promotion",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deletePromotion(promotion.id);
        await refetch();
        notify.success({ title: "Promotion deleted", message: promotion.title });
      },
    });

  /* ------------------------------- dialog ------------------------------ */

  const openDialog = (promotion: Promotion | null) => {
    setDraft(toDraft(promotion));
    setTried(false);
    setErrors([]);
  };
  const closeDialog = () => setDraft(null);
  const setField = <K extends keyof PromoDraft>(key: K, value: PromoDraft[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const url = await handleUpload(formData);
    if (url) setField("imageUrl", url);
  };

  const save = async (publish: boolean) => {
    if (!draft) return;
    setTried(true);
    const list: string[] = [];
    if (!draft.title.trim()) list.push("Give the banner a title.");
    if (draft.linkType === "screen" && !draft.screen) list.push("Choose the app screen the banner opens.");
    if (draft.linkType === "web" && !WEB_LINK_PATTERN.test(draft.web.trim()))
      list.push("Enter a full web address starting with https://");
    if (draft.end && draft.start && draft.end < draft.start) list.push("End date must be on or after the start date.");
    setErrors(list);
    if (list.length) return;

    const payload: CreatePromotionDto = {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim() || null,
      image_url: draft.imageUrl,
      cta_label: draft.linkType === "none" ? null : draft.cta.trim() || null,
      deep_link: draft.linkType === "screen" ? draft.screen : draft.linkType === "web" ? draft.web.trim() : null,
      sort_order: draft.order === "" ? null : Number(draft.order),
      start_date: draft.start || null,
      end_date: draft.end || null,
    };

    setSaving(true);
    try {
      const response = draft.id
        ? await api.put.updatePromotion(draft.id, payload)
        : await api.post.createPromotion(payload);
      let saved = response.data;
      if (publish && saved && saved.status !== "PUBLISHED") {
        saved = (await api.post.publishPromotion(saved.id)).data;
      }
      setDraft(null);
      await refetch();
      const state = saved ? stateOf(saved, today) : "draft";
      setTab(state);
      notify.success({
        title:
          state === "draft"
            ? "Draft saved"
            : state === "live"
              ? "Promotion live"
              : state === "scheduled"
                ? "Promotion scheduled"
                : "Promotion saved",
        message:
          state === "live"
            ? `${payload.title} is on the app’s Home screen.`
            : state === "scheduled"
              ? `Goes live on ${formatDay(payload.start_date)}.`
              : payload.title,
      });
    } catch (error) {
      setErrors([errorText(error, "The promotion wasn't saved. Try again.")]);
    } finally {
      setSaving(false);
    }
  };

  const ctaShown = draft && draft.linkType !== "none" ? draft.cta.trim() : "";

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Promotions"
        subtitle="Banner slides on the mobile app's Home screen. Publishing doesn't notify members."
        actions={
          canManage ? (
            <UiButton tone="primary" onClick={() => openDialog(null)}>
              New promotion
            </UiButton>
          ) : undefined
        }
      />

      <section className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-primary">On Home now</h2>
          <p className="text-sm text-gray-600">
            The first {HOME_SLOTS} live promotions show, in this order.
            {canReorder ? " Use the arrows to reorder." : ""}
          </p>
        </div>
        {live.length > HOME_SLOTS && (
          <InlineAlert tone="warning">
            {live.length - HOME_SLOTS} live promotion{live.length - HOME_SLOTS > 1 ? "s are" : " is"} hidden because only{" "}
            {HOME_SLOTS} show. Move one up or unpublish one you no longer need.
          </InlineAlert>
        )}
        <div className="flex gap-4 overflow-x-auto pb-1">
          {live.map((promotion, index) => {
            const shown = index < HOME_SLOTS;
            return (
              <div key={promotion.id} className={`flex w-[260px] flex-none flex-col gap-2 ${shown ? "" : "opacity-50"}`}>
                <div className="relative flex aspect-video flex-col justify-end gap-1 overflow-hidden rounded-xl bg-primary p-4 text-white">
                  {promotion.image_url && (
                    <>
                      <img src={promotion.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      <span className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent" />
                    </>
                  )}
                  <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <p className="relative text-base font-semibold">{promotion.title}</p>
                  {promotion.subtitle && (
                    <p className="relative truncate text-xs text-white/80">{promotion.subtitle}</p>
                  )}
                  {promotion.cta_label && promotion.deep_link && (
                    <span className="relative mt-1 self-start rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {promotion.cta_label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex-1 text-xs ${shown ? "text-gray-500" : "text-amber-700"}`}>
                    {shown
                      ? promotion.end_date
                        ? `Until ${formatDay(promotion.end_date)}`
                        : "No end date"
                      : `Hidden · only ${HOME_SLOTS} show`}
                  </span>
                  {canReorder && (
                    <>
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0 || reordering}
                        aria-label="Move earlier"
                        className="h-9 w-9 rounded-lg border border-lightGray bg-white text-primary disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === live.length - 1 || reordering}
                        aria-label="Move later"
                        className="h-9 w-9 rounded-lg border border-lightGray bg-white text-primary disabled:opacity-40"
                      >
                        ↓
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {!loading && live.length === 0 && (
            <p className="text-sm text-gray-500">Nothing is live. Home shows the annual theme only.</p>
          )}
        </div>
      </section>

      <PillTabs
        ariaLabel="Promotion status"
        className="self-start"
        tabs={TABS.map((item) => ({ ...item, count: groups[item.key].length }))}
        value={tab}
        onChange={setTab}
      />

      {loading && promotions.length === 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <ListEmpty>{EMPTY_TEXT[tab]}</ListEmpty>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
          {list.map((promotion, index) => {
            const state = stateOf(promotion, today);
            const pill =
              state === "live" ? (
                <Pill tone={index < HOME_SLOTS ? "success" : "warning"}>
                  {index < HOME_SLOTS ? "Live" : "Live · hidden"}
                </Pill>
              ) : state === "scheduled" ? (
                <Pill tone="info">Starts {formatDay(promotion.start_date)}</Pill>
              ) : state === "draft" ? (
                <Pill tone="neutral">Draft</Pill>
              ) : (
                <Pill tone="neutral">Ended {formatDay(promotion.end_date)}</Pill>
              );
            return (
              <div key={promotion.id} className="flex flex-col overflow-hidden rounded-xl border border-lightGray bg-white">
                <div className="relative flex aspect-video flex-col justify-end gap-1 bg-primary p-4 text-white">
                  {promotion.image_url && (
                    <>
                      <img src={promotion.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      <span className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent" />
                    </>
                  )}
                  <p className="relative text-base font-semibold">{promotion.title}</p>
                  {promotion.subtitle && <p className="relative text-xs text-white/80">{promotion.subtitle}</p>}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    {pill}
                    {state === "live" && (
                      <span className="text-xs text-gray-500">
                        {index < HOME_SLOTS ? `Slide ${index + 1}` : `Hidden, position ${index + 1}`}
                      </span>
                    )}
                  </div>
                  <p className="break-words text-gray-600">{describePromotionLink(promotion.deep_link)}</p>
                  <p className="text-xs text-gray-500">
                    {promotion.start_date
                      ? `${formatDay(promotion.start_date)}${promotion.end_date ? ` – ${formatDay(promotion.end_date)}` : " · no end date"}`
                      : "No dates set"}
                  </p>
                  {(canManage || canPublish || canDelete) && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      {canManage && (
                        <UiButton size="sm" onClick={() => openDialog(promotion)}>
                          Edit
                        </UiButton>
                      )}
                      {!canPublish ? null : state === "draft" ? (
                        <UiButton size="sm" tone="primary" className="px-3" onClick={() => setPublished(promotion, true)}>
                          Publish
                        </UiButton>
                      ) : state !== "ended" ? (
                        <UiButton size="sm" tone="ghost" className="text-primary hover:bg-primary/5" onClick={() => setPublished(promotion, false)}>
                          Unpublish
                        </UiButton>
                      ) : null}
                      {canDelete && (
                        <UiButton size="sm" tone="danger" onClick={() => remove(promotion)}>
                          Delete
                        </UiButton>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {draft && (
        <CommDialog
          open
          onClose={closeDialog}
          busy={saving}
          title={draft.id ? "Edit promotion" : "New promotion"}
          subtitle="A banner slide on the app’s Home screen. Publishing doesn’t notify members."
          errors={errors}
          buttons={
            draft.wasPublished
              ? [
                  { label: "Cancel", onClick: closeDialog },
                  { label: "Save changes", onClick: () => save(false), tone: "primary" },
                ]
              : [
                  { label: "Cancel", onClick: closeDialog },
                  { label: "Save draft", onClick: () => save(false), ...(canPublish ? {} : { tone: "primary" as const }) },
                  ...(canPublish
                    ? [
                        {
                          label: draft.start > todayIso() ? "Schedule" : "Publish",
                          onClick: () => save(true),
                          tone: "primary" as const,
                        },
                      ]
                    : []),
                ]
          }
        >
          <BannerPreview
            kicker="Home screen banner"
            title={draft.title || "Banner title"}
            subtitle={draft.subtitle || "One short line under the title"}
            cta={ctaShown || undefined}
            imageUrl={draft.imageUrl}
          />
          <FieldGrid>
            <Field label="Title *">
              <TextInput
                value={draft.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="Building fund campaign"
                maxLength={60}
                hasError={tried && !draft.title.trim()}
              />
              <FieldHint>{draft.title.length} / 60</FieldHint>
            </Field>
            <Field label="Subtitle">
              <TextInput
                value={draft.subtitle}
                onChange={(event) => setField("subtitle", event.target.value)}
                placeholder="One short line under the title"
                maxLength={90}
              />
              <FieldHint>{draft.subtitle.length} / 90</FieldHint>
            </Field>
            <FullRow>
              <ImageDropField
                label="Banner image"
                help="16:9, about 1200×675px. Leave empty for a plain dark card like the preview."
                previewUrl={draft.imageUrl}
                onFile={uploadImage}
                onClear={() => setField("imageUrl", null)}
                busy={uploading}
              />
            </FullRow>
            <FullRow>
              <ChoiceButtons
                label="When a member taps the banner"
                value={draft.linkType}
                onChange={(value) => setField("linkType", value)}
                options={[
                  { value: "screen", label: "Open an app screen" },
                  { value: "web", label: "Open a web page" },
                  { value: "none", label: "Nothing" },
                ]}
              />
            </FullRow>
            {draft.linkType === "screen" && (
              <Field label="App screen *">
                <SelectInput
                  value={draft.screen}
                  onChange={(event) => setField("screen", event.target.value)}
                  hasError={tried && !draft.screen}
                  options={[
                    { value: "", label: "Choose a screen" },
                    ...PROMOTION_APP_SCREENS.map((screen) => ({ value: screen.value, label: screen.label })),
                  ]}
                />
              </Field>
            )}
            {draft.linkType === "web" && (
              <Field label="Web address *">
                <TextInput
                  type="url"
                  value={draft.web}
                  onChange={(event) => setField("web", event.target.value)}
                  placeholder="https://wwmchurch.org/events"
                  maxLength={191}
                  hasError={tried && !WEB_LINK_PATTERN.test(draft.web.trim())}
                />
                <FieldHint>Opens in the app’s built-in browser.</FieldHint>
              </Field>
            )}
            {draft.linkType !== "none" && (
              <Field label="Button label">
                <TextInput
                  value={draft.cta}
                  onChange={(event) => setField("cta", event.target.value)}
                  placeholder="Reserve your seat"
                  maxLength={24}
                />
              </Field>
            )}
            <Field label="Start date">
              <TextInput type="date" value={draft.start} onChange={(event) => setField("start", event.target.value)} />
            </Field>
            <Field label="End date">
              <TextInput
                type="date"
                value={draft.end}
                min={draft.start || undefined}
                onChange={(event) => setField("end", event.target.value)}
                hasError={tried && !!draft.end && !!draft.start && draft.end < draft.start}
              />
              <FieldHint>Leave empty to keep it running until you unpublish it.</FieldHint>
            </Field>
            <Field label="Position">
              <TextInput
                type="number"
                min={1}
                value={draft.order}
                onChange={(event) => setField("order", event.target.value)}
                placeholder="1"
              />
              <FieldHint>Lower numbers show first. Only the first {HOME_SLOTS} live promotions appear.</FieldHint>
            </Field>
          </FieldGrid>
        </CommDialog>
      )}
    </PageOutline>
  );
};

export default PromotionManager;
