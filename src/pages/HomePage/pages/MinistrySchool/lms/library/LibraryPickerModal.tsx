import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { LibraryItem, LibraryType } from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { runAction } from "../runAction";
import { somPaths } from "../somUtils";
import { Btn, EmptyBlock, LoadError, Pill, type Tone } from "../ui";

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

const field = "h-10 w-full rounded-lg border border-lightGray bg-inputBackground px-3 text-sm text-primary";

type Props = {
  programId: number;
  modules: { id: number; title: string }[];
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

const PickerBody = ({ programId, modules, onClose, onAdded }: Omit<Props, "open">) => {
  const { data, loading, error, refetch } = useFetch(api.fetch.fetchContentLibrary);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [moduleId, setModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const items = useMemo(() => data?.data ?? [], [data]);
  const term = search.trim().toLowerCase();
  const rows = items.filter(
    (i) => !term || i.title.toLowerCase().includes(term) || (i.tags ?? []).some((t) => t.toLowerCase().includes(term))
  );
  const selected: LibraryItem | undefined = items.find((i) => i.id === selectedId);

  const add = async () => {
    if (!selected) return;
    setSaving(true);
    const ok = await runAction(
      () =>
        api.post.useLibraryItem({
          itemId: selected.id,
          programId,
          moduleId: moduleId ? Number(moduleId) : null,
          ...(title.trim() && title.trim() !== selected.title ? { title: title.trim() } : {}),
        }),
      { failure: "Could not add the item to the curriculum" }
    );
    setSaving(false);
    if (!ok) return;
    showNotification(`Added “${title.trim() || selected.title}” to the curriculum`, "success");
    onAdded();
    onClose();
  };

  return (
    <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-primary">Add from library</h3>
        <Link to={`${somPaths.dashboard}/content-library`} className="text-sm font-medium text-primary hover:underline">
          Manage library
        </Link>
      </div>

      <input
        type="search"
        aria-label="Search the library"
        placeholder="Search title or tag"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={field}
      />

      {error && !data ? (
        <LoadError msg="Could not load the content library." onRetry={() => refetch()} />
      ) : loading && !data ? (
        <p className="py-6 text-center text-sm text-mainGray">Loading library…</p>
      ) : !rows.length ? (
        <EmptyBlock msg={items.length ? "No items match your search." : "The library is empty. Add content from Manage library."} />
      ) : (
        <fieldset className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-200 p-1">
          <legend className="sr-only">Library item</legend>
          {rows.map((i) => (
            <label
              key={i.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-primary",
                selectedId === i.id ? "bg-gray-100" : "hover:bg-gray-50"
              )}
            >
              <input
                type="radio"
                name="library-item"
                checked={selectedId === i.id}
                onChange={() => {
                  setSelectedId(i.id);
                  setTitle(i.title);
                }}
              />
              <span className="min-w-0 flex-1 truncate text-primary">{i.title}</span>
              <Pill tone={TYPE_TONE[i.type]}>{TYPE_LABEL[i.type]}</Pill>
            </label>
          ))}
        </fieldset>
      )}

      <div className="grid gap-3 tablet:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-primary">Module</span>
          <select className={field} value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            <option value="">No module</option>
            {modules.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-primary">Unit title (optional)</span>
          <input
            className={field}
            value={title}
            placeholder={selected?.title ?? "Defaults to the item title"}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" disabled={!selected || saving} onClick={add}>
          {saving ? "Adding…" : "Add to curriculum"}
        </Btn>
      </div>
    </div>
  );
};

/** Picks a content library item and adds it to a program's curriculum as a unit. */
export const LibraryPickerModal = ({ open, ...rest }: Props) => (
  <Modal open={open} onClose={rest.onClose} className="!max-w-lg" title="Add from library">
    {open && <PickerBody {...rest} />}
  </Modal>
);

export default LibraryPickerModal;
