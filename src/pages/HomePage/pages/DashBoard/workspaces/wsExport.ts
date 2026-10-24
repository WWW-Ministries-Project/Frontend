import { downloadBlobFile } from "@/utils/helperFunctions";

export type ExportCell = string | number | null | undefined;

export interface ExportSheet {
  name: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, ExportCell>[];
}

const sheetName = (name: string, used: Set<string>) => {
  const base = name.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || "Sheet";
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n++})`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
};

export const fileSafe = (text: string) => text.replace(/[\\/:*?"<>|]/g, "-").trim();

/** Writes one worksheet per sheet into a single .xlsx and downloads it. */
export const downloadSheets = async (fileName: string, sheets: ExportSheet[]) => {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const used = new Set<string>();
  sheets.forEach((sheet) => {
    const ws = workbook.addWorksheet(sheetName(sheet.name, used));
    ws.columns = sheet.columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width ?? Math.max(12, column.header.length + 4),
    }));
    ws.getRow(1).font = { bold: true };
    sheet.rows.forEach((row) => ws.addRow(row));
  });
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlobFile(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`
  );
};

/** Label/value rows (bar lists, stats) as a two- or three-column sheet. */
export const pairSheet = (
  name: string,
  rows: { label: string; value: ExportCell; note?: ExportCell }[],
  valueHeader = "Value"
): ExportSheet => ({
  name,
  columns: [
    { header: "Item", key: "label", width: 32 },
    { header: valueHeader, key: "value", width: 16 },
    ...(rows.some((row) => row.note) ? [{ header: "Note", key: "note", width: 32 }] : []),
  ],
  rows: rows.map((row) => ({ label: row.label, value: row.value, note: row.note ?? "" })),
});
