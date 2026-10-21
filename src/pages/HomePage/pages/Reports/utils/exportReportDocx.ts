import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { downloadBlobFile } from "@/utils";
import type { ApiSection, DeptReportDetail } from "@/utils/api/reports/interfaces";

import { toKpi } from "./reportAdapters";
import { fmtDate, formatDelta, nf } from "./reportFormat";
import type { CompareMode } from "./reportTypes";

/**
 * Word version of a department report: the same content as the print view,
 * with each chart written out as a small table of its numbers.
 */

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "D8DAE5" };
const cell = (text: string, bold = false, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) =>
  new TableCell({
    borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text, bold, size: 18 })] })],
  });

const grid = (head: string[], rows: string[][], rightFrom = 1) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, true, i >= rightFrom ? AlignmentType.RIGHT : AlignmentType.LEFT)) }),
      ...rows.map((r) => new TableRow({ children: r.map((v, i) => cell(v, false, i >= rightFrom ? AlignmentType.RIGHT : AlignmentType.LEFT)) })),
    ],
  });

const heading = (
  text: string,
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2
) => new Paragraph({ heading: level, spacing: { before: 240, after: 80 }, text });
const para = (text: string, opts: { bold?: boolean; color?: string; italics?: boolean } = {}) =>
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, size: 20, ...opts })] });
const bullet = (text: string) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text, size: 20 })] });

const cellText = (c: unknown): string => {
  if (c === null || c === undefined) return "—";
  if (typeof c === "object") {
    const o = c as { text?: string; pill?: { label: string } };
    return o.pill?.label ?? o.text ?? "—";
  }
  return String(c);
};

const sectionBlocks = (s: ApiSection): (Paragraph | Table)[] => {
  const out: (Paragraph | Table)[] = [heading(s.title, HeadingLevel.HEADING_3)];
  if (s.sub) out.push(para(s.sub, { color: "4B5563" }));
  const money = (v: number, m?: boolean) => (m ? `GH₵ ${Math.round(v).toLocaleString("en-GB")}` : nf(v));
  switch (s.kind) {
    case "bars":
      out.push(
        grid(
          ["", ...s.series.map((x) => x.name), ...(s.line ? [s.line.name] : [])],
          s.labels.map((l, i) => [l, ...s.series.map((x) => money(x.values[i] || 0, s.money)), ...(s.line ? [money(s.line.values[i] || 0, s.money)] : [])])
        )
      );
      break;
    case "hbars":
      out.push(grid(["", "Value"], s.rows.map((r) => [r.label, r.display ?? money(r.value, s.money)])));
      break;
    case "funnel":
      out.push(grid(["Step", "People"], s.steps.map((x) => [x.label, nf(x.value)])));
      break;
    case "table":
      out.push(grid(s.columns.map((c) => c.label), s.rows.map((r) => r.cells.map(cellText)), 99));
      break;
    case "segments":
      s.groups.forEach((g) => {
        const total = g.parts.reduce((a, p) => a + p.value, 0) || 1;
        out.push(grid([g.label || "", "Count", "Share"], g.parts.map((p) => [p.label, p.display ?? nf(p.value), `${Math.round((p.value / total) * 100)}%`])));
      });
      break;
    case "heat":
      out.push(grid(["", ...s.columns], s.rows.map((r) => [r.label, ...r.cells.map((c) => c.text)])));
      break;
    case "list":
      out.push(grid(["", ""], s.items.map((i) => [`${i.title}${i.sub ? ` — ${i.sub}` : ""}`, i.pill?.label ?? i.right ?? ""])));
      break;
    case "stats":
      out.push(grid(["", "Value", ""], s.stats.map((x) => [x.label, x.value, x.sub ?? ""])));
      break;
    case "calendar":
      out.push(para(s.days.filter((d) => d.colors.length).map((d) => d.tip).join("; ")));
      break;
  }
  if (s.note) out.push(para(s.note, { italics: true, color: "6B7280" }));
  return out;
};

export const downloadDepartmentReportDocx = async (report: DeptReportDetail, compare: CompareMode) => {
  const { meta, period, branch, workflow, body } = report;
  const vs = `vs ${compare === "yoy" ? period.yoy_label : period.prev_label}`;
  const prepared = workflow.prepared_by?.name || meta.hod_role;
  const children: (Paragraph | Table)[] = [
    para("WORLDWIDE WORD MINISTRIES", { bold: true, color: "6B7280" }),
    new Paragraph({ heading: HeadingLevel.TITLE, text: meta.name }),
    para(`${period.label} · ${branch.name} · Prepared by ${prepared}`),
    para(
      `Status: ${workflow.status_label}${workflow.submitted_at ? ` · Submitted ${fmtDate(workflow.submitted_at)}` : ` · Due ${fmtDate(workflow.due_date)}`}${
        workflow.approved_at ? ` · Approved ${fmtDate(workflow.approved_at)}` : ""
      }`,
      { color: "4B5563" }
    ),
  ];
  if (body.provisional_note) children.push(para(`Provisional: ${body.provisional_note}`, { color: "B45309" }));

  children.push(heading("Key figures"));
  children.push(
    grid(
      ["Measure", "Value", `Change ${vs}`],
      body.kpis.map((k) => {
        const tile = toKpi(k, compare);
        return [k.label, tile.value, tile.delta ? formatDelta(tile.delta, tile.format) : "—"];
      })
    )
  );

  children.push(heading("Needs attention"));
  if (body.flags.length) body.flags.forEach((f) => children.push(bullet(`${f.severity === "act" ? "Act now" : "Watch"}: ${f.text}`)));
  else children.push(para("Nothing needs attention this period."));

  children.push(heading("Highlights"));
  body.highlights.forEach((h) => children.push(bullet(h)));

  body.sections.concat(body.by_branch && branch.id === null ? [body.by_branch] : []).forEach((s) => children.push(...sectionBlocks(s)));

  children.push(heading("Head of department commentary"));
  (
    [
      ["Highlights and wins", workflow.commentary.wins],
      ["Challenges", workflow.commentary.challenges],
      ["Plans for next period", workflow.commentary.plans],
      ["Testimonies and prayer points", workflow.commentary.testimonies],
    ] as const
  ).forEach(([label, value]) => {
    children.push(para(label, { bold: true }));
    children.push(para(value || "Nothing written yet.", value ? {} : { color: "6B7280" }));
  });
  if (workflow.requests.length) {
    children.push(para("Requests to leadership", { bold: true }));
    workflow.requests.forEach((r) =>
      children.push(bullet(`${r.text}${r.outcome ? ` (${r.outcome === "APPROVED" ? "Approved" : "Responded"})` : r.needs_decision ? " (Needs decision)" : ""}`))
    );
  }

  children.push(heading("Approval trail"));
  workflow.trail.forEach((t) => children.push(bullet(`${t.action} — ${t.who}${t.when ? ` · ${/^\d{4}-/.test(t.when) ? fmtDate(t.when) : t.when}` : ""}`)));
  if (workflow.comments.length) {
    children.push(heading("Leadership comments"));
    workflow.comments.forEach((c) => children.push(para(`${c.author} · ${fmtDate(c.when)}: ${c.text}`)));
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Work Sans" } } } },
    sections: [{ children }],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlobFile(blob, `${meta.name} – ${period.label}.docx`);
};
