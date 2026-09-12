import CreatableSelect from "react-select/creatable";
import { useMemo } from "react";
import type { SermonTag } from "@/utils/api/sermons/interfaces";

/** Must match toTagSlug in the Backend's sermonTagService.ts. */
const toSlug = (value: string) =>
  value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");

interface TagOption {
  label: string;
  value: string;
}

interface TagSelectProps {
  label?: string;
  suggestions: SermonTag[];
  value: string[];
  onChange: (names: string[]) => void;
  disabled?: boolean;
}

export const TagSelect = ({
  label = "Tags",
  suggestions,
  value,
  onChange,
  disabled,
}: TagSelectProps) => {
  const options = useMemo<TagOption[]>(
    () => suggestions.map((tag) => ({ label: tag.name, value: tag.name })),
    [suggestions]
  );

  const selected = useMemo<TagOption[]>(
    () => value.map((name) => ({ label: name, value: name })),
    [value]
  );

  const knownSlugs = useMemo(
    () => new Set(suggestions.map((tag) => tag.slug)),
    [suggestions]
  );

  return (
    <div className="flex flex-col gap-1">
      <label className="block text-sm font-medium" htmlFor="sermon-tags">
        {label}
      </label>

      <CreatableSelect
        inputId="sermon-tags"
        isMulti
        isDisabled={disabled}
        options={options}
        value={selected}
        placeholder="Type to search or create a tag"
        onChange={(next) =>
          onChange((next ?? []).map((option) => option.value.trim()))
        }
        // Suppress "Create ..." when the typed text already resolves to an
        // existing tag or to one already selected. The Backend dedupes anyway,
        // but offering the option invites the user to think they are distinct.
        isValidNewOption={(input) => {
          const slug = toSlug(input);
          if (!slug) return false;
          if (knownSlugs.has(slug)) return false;
          return !value.some((name) => toSlug(name) === slug);
        }}
        formatCreateLabel={(input) => `Create "${input.trim()}"`}
        classNamePrefix="tag-select"
        styles={{
          control: (base) => ({ ...base, borderRadius: "0.5rem" }),
          menu: (base) => ({ ...base, zIndex: 200 }),
        }}
      />

      <p className="text-xs text-gray-400">
        Existing tags are suggested as you type. Tags are shared across the
        church, so reuse one rather than creating a near-duplicate.
      </p>
    </div>
  );
};

export default TagSelect;
