import { useCallback, useMemo, useState } from "react";

import { InlineAlert, notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePictureUpload } from "@/CustomHooks/usePictureUpload";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type { AnnualTheme, AnnualThemePayload } from "@/utils/api/theme/interfaces";

import PageOutline from "../../Components/PageOutline";
import {
  Field,
  PageHeading,
  Pill,
  SectionEmpty,
  TextArea,
  TextInput,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import ThemeImageCropper, { type CroppedThemeImage } from "./Components/ThemeImageCropper";
import {
  BannerPreview,
  CheckCard,
  CommDialog,
  FieldGrid,
  FieldHint,
  FullRow,
} from "./ui/commUi";
import {
  errorText,
  useViewportWidth,
  PHONE_MAX,
} from "./ui/commUtils";

interface ThemeDraft {
  id: number | null;
  year: string;
  title: string;
  verseReference: string;
  verse: string;
  message: string;
  imageUrl: string | null;
  isActive: boolean;
}

const MAX_MESSAGE = 1000;

const toDraft = (theme: AnnualTheme | null, nextYear: string, yearTaken: boolean): ThemeDraft =>
  theme
    ? {
        id: theme.id,
        year: String(theme.year),
        title: theme.title ?? "",
        verseReference: theme.verseReference ?? "",
        verse: theme.verse ?? "",
        message: theme.message ?? "",
        imageUrl: theme.imageUrl ?? null,
        isActive: !!theme.isActive,
      }
    : {
        id: null,
        year: yearTaken ? "" : nextYear,
        title: "",
        verseReference: "",
        verse: "",
        message: "",
        imageUrl: null,
        isActive: false,
      };

const AnnualThemeManager = () => {
  const { hasPermission } = useAccessControl();
  const canManage = hasPermission("manage_theme");
  const phone = useViewportWidth() < PHONE_MAX;
  const { data, loading, refetch } = useFetch(api.fetch.fetchAnnualTheme);
  const { handleUpload } = usePictureUpload();

  const [draft, setDraft] = useState<ThemeDraft | null>(null);
  const [tried, setTried] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [croppedImage, setCroppedImage] = useState<CroppedThemeImage | null>(null);

  const themes = useMemo(
    () => [...(Array.isArray(data?.data) ? data.data : [])].sort((a, b) => b.year - a.year),
    [data]
  );
  const current = themes.find((theme) => theme.isActive) ?? null;
  const thisYear = new Date().getFullYear();
  const nextYear = String(thisYear + 1);
  const hasNextYear = themes.some((theme) => String(theme.year) === nextYear);
  // From September, nudge the team to prepare next year's theme.
  const showGap = canManage && !loading && !hasNextYear && new Date().getMonth() >= 8;

  const openDialog = (theme: AnnualTheme | null) => {
    setDraft(toDraft(theme, nextYear, hasNextYear));
    setTried(false);
    setErrors([]);
    setCroppedImage(null);
  };
  const closeDialog = () => setDraft(null);
  const setField = <K extends keyof ThemeDraft>(key: K, value: ThemeDraft[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  const onCropped = useCallback((image: CroppedThemeImage | null) => setCroppedImage(image), []);

  const validate = (d: ThemeDraft) => {
    const list: string[] = [];
    const year = d.year.trim();
    if (!/^\d{4}$/.test(year)) list.push("Enter the year as 4 digits, for example 2027.");
    else if (themes.some((theme) => String(theme.year) === year && theme.id !== d.id))
      list.push(`There is already a theme for ${year}. Edit that one instead.`);
    if (!d.title.trim()) list.push("Give the theme a title.");
    return list;
  };

  const save = async () => {
    if (!draft) return;
    setTried(true);
    const list = validate(draft);
    setErrors(list);
    if (list.length) return;

    setSaving(true);
    try {
      let imageUrl = draft.imageUrl;
      if (croppedImage) {
        const formData = new FormData();
        formData.append("file", croppedImage.file);
        const uploaded = await handleUpload(formData);
        if (!uploaded) {
          setErrors(["The artwork didn't upload. Try again or save without it."]);
          return;
        }
        imageUrl = uploaded;
      }
      const payload: AnnualThemePayload = {
        year: Number(draft.year.trim()),
        title: draft.title.trim(),
        verseReference: draft.verseReference.trim(),
        verse: draft.verse.trim(),
        message: draft.message.trim(),
        imageUrl,
        isActive: draft.isActive,
      };
      if (draft.id) await api.put.updateAnnualTheme(payload, { id: draft.id });
      else await api.post.createAnnualTheme(payload);
      setDraft(null);
      await refetch();
      notify.success({
        title: draft.id ? "Theme updated" : "Theme created",
        message: `${payload.title} · ${payload.year}${payload.isActive ? " is now shown in the app." : ""}`,
      });
    } catch (error) {
      setErrors([errorText(error, "The theme wasn't saved. Try again.")]);
    } finally {
      setSaving(false);
    }
  };

  const makeCurrent = (theme: AnnualTheme) =>
    confirmAction({
      title: `Make “${theme.title}” the current theme?`,
      points: [
        "Members see it on the app’s Home screen and dashboard straight away.",
        current
          ? `${current.year}’s “${current.title}” moves to past themes.`
          : "No theme is current right now.",
      ],
      confirmLabel: "Make current",
      cancelLabel: current ? `Keep ${current.year}` : "Keep as is",
      onConfirm: async () => {
        await api.put.updateAnnualTheme({ isActive: true }, { id: theme.id });
        await refetch();
        notify.success({ title: `${theme.title} is now current` });
      },
    });

  const deleteTheme = (theme: AnnualTheme) =>
    confirmAction({
      title: `Delete the ${theme.year} theme?`,
      points: [`“${theme.title}” and its artwork are removed.`, "This can’t be undone."],
      confirmLabel: "Delete theme",
      cancelLabel: "Keep theme",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deleteAnnualTheme({ id: theme.id });
        await refetch();
        notify.success({ title: "Theme deleted", message: `${theme.year} · ${theme.title}` });
      },
    });

  const statusPill = (theme: AnnualTheme) =>
    theme.isActive ? (
      <Pill tone="success">Current</Pill>
    ) : theme.year > thisYear ? (
      <Pill tone="info">Upcoming</Pill>
    ) : (
      <Pill tone="neutral">Past</Pill>
    );

  const otherCurrent = draft ? themes.find((theme) => theme.isActive && theme.id !== draft.id) : null;

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Annual themes"
        subtitle="The yearly theme shown on the member app and dashboard."
        actions={
          canManage ? (
            <UiButton tone="primary" onClick={() => openDialog(null)}>
              New theme
            </UiButton>
          ) : undefined
        }
      />

      {showGap && (
        <InlineAlert
          tone="info"
          title={`No theme for ${nextYear} yet`}
          action={{ label: `Create ${nextYear} theme`, onClick: () => openDialog(null) }}
        >
          Members keep seeing {current ? `“${current.title}”` : "no theme"} after 1 January until a {nextYear} theme is made
          current.
        </InlineAlert>
      )}

      {current && (
        <div className="flex flex-wrap overflow-hidden rounded-xl bg-primary text-white">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4 px-5 py-6 sm:p-8">
            <span className="self-start rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold">
              {current.year} · Current theme
            </span>
            <h2 className="text-2xl font-semibold leading-tight [text-wrap:balance] sm:text-[32px]">{current.title}</h2>
            {(current.verse || current.verseReference) && (
              <div className="flex flex-col gap-1">
                {current.verse && (
                  <p className="text-base italic leading-6 text-white/90 [text-wrap:pretty]">“{current.verse}”</p>
                )}
                {current.verseReference && <p className="text-sm font-semibold">{current.verseReference}</p>}
              </div>
            )}
            {current.message && <p className="text-sm text-white/80 [text-wrap:pretty]">{current.message}</p>}
            {canManage && (
              <div>
                <button
                  type="button"
                  onClick={() => openDialog(current)}
                  className="min-h-10 rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-white/90"
                >
                  Edit theme
                </button>
              </div>
            )}
          </div>
          <div className="flex min-h-[200px] flex-[1_1_280px] p-4">
            {current.imageUrl ? (
              <img src={current.imageUrl} alt="" className="w-full rounded-lg object-cover" />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/35 bg-white/[0.06] p-4 text-center">
                <p className="text-sm font-semibold">Theme artwork</p>
                <p className="text-xs text-white/70">16:9 image shown on the app’s Home screen</p>
              </div>
            )}
          </div>
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-primary">All themes</h2>
        {loading && themes.length === 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-xl bg-[#F3F4F6]" />
            ))}
          </div>
        ) : themes.length === 0 ? (
          <SectionEmpty
            badge="Annual themes"
            title="No themes yet"
            text="Create the theme for this year so members see it on the app's Home screen."
            action={
              canManage ? (
                <UiButton tone="primary" onClick={() => openDialog(null)}>
                  New theme
                </UiButton>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
            {themes.map((theme) => (
              <div key={theme.id} className="flex flex-col gap-2 rounded-xl border border-lightGray bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xl font-semibold leading-7 text-primary">{theme.year}</span>
                  {statusPill(theme)}
                </div>
                <p className="text-base font-semibold text-primary">{theme.title}</p>
                {theme.verseReference && <p className="text-sm text-[#4B5563]">{theme.verseReference}</p>}
                {theme.verse && <p className="line-clamp-2 text-sm italic text-[#6B7280]">{theme.verse}</p>}
                {canManage && (
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <UiButton size="sm" onClick={() => openDialog(theme)}>
                      Edit
                    </UiButton>
                    {!theme.isActive && (
                      <>
                        <UiButton size="sm" tone="ghost" className="text-primary hover:bg-primary/5" onClick={() => makeCurrent(theme)}>
                          Make current
                        </UiButton>
                        <UiButton
                          size="sm"
                          tone="ghost"
                          className="text-[#B91C1C] hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                          onClick={() => deleteTheme(theme)}
                        >
                          Delete
                        </UiButton>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {draft && (
        <CommDialog
          open
          onClose={closeDialog}
          busy={saving}
          title={draft.id ? `Edit ${draft.year} theme` : "New annual theme"}
          subtitle="Shown on the member app’s Home screen and the dashboard."
          errors={errors}
          buttons={[
            { label: "Cancel", onClick: closeDialog },
            { label: draft.id ? "Save changes" : "Create theme", onClick: save, tone: "primary" },
          ]}
        >
          <BannerPreview
            kicker={`${draft.year || "Year"} theme`}
            title={draft.title || "Theme title"}
            subtitle={
              draft.verse ? `“${draft.verse}” ${draft.verseReference}` : "Bible verse appears here"
            }
            imageUrl={croppedImage?.previewUrl ?? draft.imageUrl}
            className={phone ? "max-h-48" : undefined}
          />
          <FieldGrid>
            <Field label="Year *">
              <TextInput
                value={draft.year}
                onChange={(event) => setField("year", event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="2027"
                inputMode="numeric"
                hasError={tried && !/^\d{4}$/.test(draft.year)}
              />
            </Field>
            <Field label="Theme title *">
              <TextInput
                value={draft.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="Year of Breakthrough"
                maxLength={80}
                hasError={tried && !draft.title.trim()}
              />
            </Field>
            <Field label="Bible verse reference">
              <TextInput
                value={draft.verseReference}
                onChange={(event) => setField("verseReference", event.target.value)}
                placeholder="Jeremiah 29:11"
                maxLength={40}
              />
            </Field>
            <FullRow>
              <Field label="Bible verse">
                <TextArea
                  value={draft.verse}
                  onChange={(event) => setField("verse", event.target.value)}
                  placeholder="For I know the plans I have for you…"
                  maxLength={400}
                />
              </Field>
            </FullRow>
            <FullRow>
              <Field label="Theme message">
                <TextArea
                  rows={4}
                  value={draft.message}
                  onChange={(event) => setField("message", event.target.value)}
                  placeholder="What this theme means for the church this year"
                  maxLength={MAX_MESSAGE}
                />
                <FieldHint>
                  {draft.message.length} / {MAX_MESSAGE} characters
                </FieldHint>
              </Field>
            </FullRow>
            <FullRow>
              <ThemeImageCropper initialImageUrl={draft.imageUrl ?? undefined} onCroppedImageChange={onCropped} />
            </FullRow>
            <FullRow>
              <CheckCard
                checked={draft.isActive}
                onChange={(value) => setField("isActive", value)}
                label="Make this the current theme"
                help={
                  otherCurrent
                    ? `Replaces “${otherCurrent.title}” in the app straight away.`
                    : "Shows in the app straight away."
                }
              />
            </FullRow>
          </FieldGrid>
        </CommDialog>
      )}
    </PageOutline>
  );
};

export default AnnualThemeManager;
