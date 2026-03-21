import type { AiDisplay, AiDisplayBlock, AiDisplaySection } from "@/utils/api/ai/interfaces";

interface Props {
  display?: AiDisplay | null;
  fallbackText: string;
}

const GENERIC_SECTION_HEADINGS = new Set(["response", "summary", "details"]);

const buildFallbackDisplay = (fallbackText: string): AiDisplay | null => {
  const normalized = String(fallbackText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) {
    return null;
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    format: "structured_markdown_v1",
    title: null,
    summary: null,
    sections: [
      {
        heading: "Response",
        blocks: paragraphs.map((paragraph) => ({
          type: "paragraph" as const,
          text: paragraph,
        })),
        paragraphs,
        items: [],
        tables: [],
      },
    ],
    markdown: normalized,
    plain_text: normalized,
  };
};

const shouldShowSectionHeading = (
  section: AiDisplaySection,
  totalSections: number,
  hasTitle: boolean
) => {
  if (!section.heading.trim()) {
    return false;
  }

  const normalizedHeading = section.heading.trim().toLowerCase();
  if (totalSections === 1 && !hasTitle && GENERIC_SECTION_HEADINGS.has(normalizedHeading)) {
    return false;
  }

  return true;
};

const buildSectionBlocks = (section: AiDisplaySection): AiDisplayBlock[] => {
  if (Array.isArray(section.blocks) && section.blocks.length > 0) {
    return section.blocks;
  }

  const blocks: AiDisplayBlock[] = [];

  for (const paragraph of section.paragraphs ?? []) {
    if (paragraph.trim()) {
      blocks.push({
        type: "paragraph",
        text: paragraph,
      });
    }
  }

  if (Array.isArray(section.items) && section.items.length > 0) {
    blocks.push({
      type: "list",
      items: section.items,
    });
  }

  for (const table of section.tables ?? []) {
    if ((table.columns?.length ?? 0) > 0 && (table.rows?.length ?? 0) > 0) {
      blocks.push({
        type: "table",
        columns: table.columns,
        rows: table.rows,
      });
    }
  }

  return blocks;
};

const renderBlock = (block: AiDisplayBlock, sectionIndex: number, blockIndex: number) => {
  if (block.type === "paragraph") {
    return (
      <p
        key={`paragraph-${sectionIndex}-${blockIndex}`}
        className="whitespace-pre-wrap text-sm leading-6 text-gray-700"
      >
        {block.text}
      </p>
    );
  }

  if (block.type === "list") {
    return (
      <ul
        key={`list-${sectionIndex}-${blockIndex}`}
        className="list-disc space-y-1 pl-5 text-sm leading-6 text-gray-700"
      >
        {block.items.map((item, itemIndex) => (
          <li key={`list-item-${sectionIndex}-${blockIndex}-${itemIndex}`}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <div
      key={`table-${sectionIndex}-${blockIndex}`}
      className="overflow-x-auto rounded-lg border border-gray-200"
    >
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            {block.columns.map((column, columnIndex) => (
              <th
                key={`table-head-${sectionIndex}-${blockIndex}-${columnIndex}`}
                className="whitespace-nowrap px-3 py-2 font-semibold"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr
              key={`table-row-${sectionIndex}-${blockIndex}-${rowIndex}`}
              className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/70"}
            >
              {block.columns.map((_, columnIndex) => (
                <td
                  key={`table-cell-${sectionIndex}-${blockIndex}-${rowIndex}-${columnIndex}`}
                  className="align-top px-3 py-2 text-gray-700"
                >
                  {row[columnIndex] || "--"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const AiStructuredMessage = ({ display, fallbackText }: Props) => {
  const normalizedDisplay =
    display && Array.isArray(display.sections) && display.sections.length > 0
      ? display
      : buildFallbackDisplay(fallbackText);

  if (!normalizedDisplay) {
    return <p className="text-sm leading-6 text-gray-700">No response from AI service.</p>;
  }

  const title = normalizedDisplay.title?.trim() || null;
  const summary = normalizedDisplay.summary?.trim() || null;
  const sections = normalizedDisplay.sections ?? [];

  return (
    <div className="space-y-4">
      {title ? (
        <div>
          <h3 className="text-base font-semibold text-primary">{title}</h3>
          {summary ? (
            <p className="mt-1 text-sm leading-6 text-gray-600">{summary}</p>
          ) : null}
        </div>
      ) : summary ? (
        <p className="text-sm leading-6 text-gray-700">{summary}</p>
      ) : null}

      {sections.map((section, sectionIndex) => {
        const blocks = buildSectionBlocks(section);

        if (!blocks.length && !section.items.length && !section.tables.length) {
          return null;
        }

        const showHeading = shouldShowSectionHeading(
          section,
          sections.length,
          Boolean(title)
        );

        return (
          <section
            key={`section-${sectionIndex}`}
            className="rounded-xl border border-gray-200 bg-white/80 p-3 shadow-sm"
          >
            {showHeading ? (
              <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                {section.heading}
              </h4>
            ) : null}

            <div className={showHeading ? "mt-3 space-y-3" : "space-y-3"}>
              {blocks.map((block, blockIndex) =>
                renderBlock(block, sectionIndex, blockIndex)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};
