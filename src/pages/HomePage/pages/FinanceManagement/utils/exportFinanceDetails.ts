import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { Workbook } from "exceljs";
import { jsPDF } from "jspdf";
import { downloadBlobFile } from "@/utils/helperFunctions";
import { FinanceData } from "@/utils/api/finance/interface";
import { buildFinanceSummary } from "./helperFunctions";

export type FinanceExportFormat = "docx" | "xlsx" | "pdf";

type ExportRow = Array<string | number>;

type ExportSection = {
  title: string;
  type: "metadata" | "financial";
  columns?: TableColumn[];
  rows: ExportRow[];
};

type TableColumn = {
  header: string;
  width: number;
  align: "left" | "right";
};

const MIME_TYPES: Record<FinanceExportFormat, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

const FINANCIAL_COLUMNS: TableColumn[] = [
  { header: "Item / Movement", width: 40, align: "left" },
  { header: "", width: 10, align: "left" },
  { header: "Portion", width: 14, align: "right" },
  { header: "Amount / Actuals", width: 18, align: "right" },
  { header: "Funds / Adjusted", width: 18, align: "right" },
];

const METADATA_COLUMNS: TableColumn[] = [
  { header: "Field", width: 35, align: "left" },
  { header: "Value", width: 65, align: "left" },
];

const getColumns = (section: ExportSection): TableColumn[] =>
  section.columns ||
  (section.type === "metadata" ? METADATA_COLUMNS : FINANCIAL_COLUMNS);

const createFinancialColumns = ({
  itemHeader = "Item / Movement",
  portionHeader = "",
  amountHeader = "Amount / Actuals",
  fundsHeader = "Funds / Adjusted",
}: {
  itemHeader?: string;
  portionHeader?: string;
  amountHeader?: string;
  fundsHeader?: string;
} = {}): TableColumn[] =>
  FINANCIAL_COLUMNS.map((column, index) => ({
    ...column,
    header:
      index === 0
        ? itemHeader
        : index === 2
        ? portionHeader
        : index === 3
        ? amountHeader
        : index === 4
        ? fundsHeader
        : column.header,
  }));

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toRatio = (value: unknown): number => {
  const numeric = toNumber(value);
  return Math.abs(numeric) <= 1 ? numeric : numeric / 100;
};

const formatAmount = (value: unknown): string =>
  toNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPercent = (value: unknown): string => {
  const percent = toRatio(value) * 100;
  const formatted = Number.isInteger(percent)
    ? String(percent)
    : percent.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted}%`;
};

const formatStatus = (value?: string | null): string =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";

const safeText = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
};

const getFileBaseName = (financeData: FinanceData): string => {
  const meta = financeData.metaData;
  const parts = [
    "finance-details",
    meta?.month,
    meta?.year,
    meta?.week,
  ].filter(Boolean);

  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const createExportSections = (financeData: FinanceData): ExportSection[] => {
  const summary = buildFinanceSummary(financeData);
  const balance = financeData.balance;

  return [
    {
      title: "Metadata",
      type: "metadata",
      rows: [
        ["Month", safeText(financeData.metaData?.month)],
        ["Year", safeText(financeData.metaData?.year)],
        ["Week", safeText(financeData.metaData?.week)],
        ["From", safeText(financeData.metaData?.from)],
        ["To", safeText(financeData.metaData?.to)],
        ["Period Date", safeText(financeData.metaData?.periodDate)],
        ["Status", formatStatus((financeData as any).status)],
        ["Created By", safeText(financeData.metaData?.createdBy)],
        ["Created Date", safeText(financeData.metaData?.createdDate)],
        ["Updated By", safeText(financeData.metaData?.updatedBy)],
        ["Updated Date", safeText(financeData.metaData?.updatedDate)],
      ],
    },
    {
      title: "Receipts",
      type: "financial",
      columns: createFinancialColumns({
        itemHeader: "Item",
        amountHeader: "Amount",
        fundsHeader: "Funds",
      }),
      rows: [
        ...(financeData.receipts || []).map((receipt) => [
          receipt.item,
          "",
          "",
          formatAmount(receipt.amount),
          "",
        ]),
        [
          "Total Receipts",
          "",
          "",
          formatAmount(summary.receipts.total),
          formatAmount(summary.receipts.total),
        ],
      ],
    },
    {
      title: "Tithe",
      type: "financial",
      columns: createFinancialColumns({
        itemHeader: "Item",
        portionHeader: "Portion",
        amountHeader: "Amount",
        fundsHeader: "Funds",
      }),
      rows: [
        [
          financeData.tithe?.totalTithe?.label || "Tithe",
          "",
          formatPercent(financeData.tithe?.totalTithe?.percentage),
          formatAmount(summary.tithe.amount),
          formatAmount(summary.tithe.fundsAfterTithe),
        ],
        ...summary.tithe.breakdown.map((entry: any) => [
          entry.item,
          "",
          formatPercent(entry.percentage),
          formatAmount(entry.amount),
          "",
        ]),
      ],
    },
    {
      title: "Payments",
      type: "financial",
      columns: createFinancialColumns({
        itemHeader: "Item",
        amountHeader: "Amount",
        fundsHeader: "Funds",
      }),
      rows: [
        ...(financeData.payments || []).map((payment) => [
          payment.item,
          "",
          "",
          formatAmount(payment.amount),
          "",
        ]),
        [
          "Total Payments",
          "",
          "",
          formatAmount(summary.payments.total),
          formatAmount(summary.balance.excessAfterPayments),
        ],
      ],
    },
    {
      title: "Balance Summary",
      type: "financial",
      columns: createFinancialColumns({
        itemHeader: "Item",
        amountHeader: "Amount",
        fundsHeader: "Funds",
      }),
      rows: [
        [
          balance?.ExcessOfReceiptsOverPayments?.item ||
            "Excess of Receipts over Payments",
          "",
          "",
          formatAmount(summary.balance.excessAfterPayments),
          "",
        ],
        [
          balance?.ReserveForSavings?.item || "Reserved for Savings",
          "",
          "",
          formatAmount(summary.balance.reserveForSavings),
          "",
        ],
        [
          balance?.BalanceAmount?.item || "Balance",
          "",
          "",
          formatAmount(summary.balance.netBalance),
          "",
        ],
        [
          balance?.WeeklyRefund?.item || "Weekly Refund",
          "",
          "",
          formatAmount(summary.balance.weeklyRefund),
          "",
        ],
        [
          balance?.OfficeMaintenanceReserve?.item ||
            "Office Maintenance Reserve",
          "",
          "",
          formatAmount(summary.balance.officeReserve),
          "",
        ],
        [
          "Total Balance",
          "",
          "",
          formatAmount(summary.balance.finalBalance),
          formatAmount(summary.balance.finalBalance),
        ],
      ],
    },
    {
      title: "Fund Allocation",
      type: "financial",
      columns: createFinancialColumns({
        itemHeader: "Movement",
        portionHeader: "Portions",
        amountHeader: "Actuals",
        fundsHeader: "Adjusted",
      }),
      rows: [
        ...summary.fundAllocations.map((allocation: any) => [
          allocation.movement,
          "",
          formatPercent(allocation.portionPercent),
          formatAmount(allocation.actual),
          formatAmount(allocation.adjusted),
        ]),
        [
          "Total Fund Allocation",
          "",
          formatPercent(
            summary.fundAllocations.reduce(
              (total: number, allocation: any) =>
                total + toRatio(allocation.portionPercent),
              0
            )
          ),
          formatAmount(summary.fundAllocationTotals.actual),
          formatAmount(summary.fundAllocationTotals.adjusted),
        ],
      ],
    },
  ];
};

const createTitle = (financeData: FinanceData): string => {
  const meta = financeData.metaData;
  return [
    "Receipts and Payments Account",
    [meta?.month, meta?.year, meta?.week].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" - ");
};

const createDocxCell = (
  value: string | number,
  column: TableColumn,
  bold = false
) =>
  new TableCell({
    width: { size: column.width, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        alignment:
          column.align === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text: safeText(value), bold })],
      }),
    ],
  });

const createDocxTable = (section: ExportSection) => {
  const columns = getColumns(section);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: columns.map((column) =>
          createDocxCell(column.header, column, true)
        ),
      }),
      ...section.rows.map(
        (row) =>
          new TableRow({
            children: columns.map((column, index) =>
              createDocxCell(row[index] ?? "", column)
            ),
          })
      ),
    ],
  });
};

const buildDocxBlob = async (
  financeData: FinanceData,
  sections: ExportSection[]
): Promise<Blob> => {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: createTitle(financeData),
          bold: true,
          size: 32,
        }),
      ],
    }),
    ...sections.flatMap((section) => [
      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: section.title, bold: true, size: 24 })],
      }),
      createDocxTable(section),
    ]),
  ];

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
};

const buildXlsxBlob = async (
  financeData: FinanceData,
  sections: ExportSection[]
): Promise<Blob> => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Finance Details");

  worksheet.addRow([createTitle(financeData)]);
  worksheet.getRow(1).font = { bold: true, size: 16 };
  worksheet.addRow([]);

  sections.forEach((section) => {
    const columns = getColumns(section);
    const titleRow = worksheet.addRow([section.title]);
    titleRow.font = { bold: true, size: 13 };

    const headerRow = worksheet.addRow(columns.map((column) => column.header));
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFEFEF" },
    };

    section.rows.forEach((row) => worksheet.addRow(row));
    worksheet.addRow([]);
  });

  worksheet.columns = [
    { width: 34 },
    { width: 10 },
    { width: 14 },
    { width: 18 },
    { width: 18 },
  ];

  worksheet.eachRow((row) => {
    row.eachCell((cell, colNumber) => {
      if (colNumber >= 3) {
        cell.alignment = { horizontal: "right" };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer as BlobPart], { type: MIME_TYPES.xlsx });
};

const addPdfText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  align: "left" | "right"
) => {
  const lines = doc.splitTextToSize(text, width);
  lines.forEach((line: string, index: number) => {
    doc.text(line, align === "right" ? x + width : x, y + index * 5, {
      align,
    });
  });
};

const getPdfColumnWidths = (section: ExportSection): number[] =>
  section.type === "metadata" ? [58, 124] : [73, 18, 24, 33, 34];

const getPdfRowHeight = (
  doc: jsPDF,
  row: ExportRow,
  columnWidths: number[]
): number => {
  const maxLines = row.reduce((count, cell, index) => {
    const lines = doc.splitTextToSize(safeText(cell), columnWidths[index] - 4);
    return Math.max(count, lines.length);
  }, 1);

  return Math.max(8, maxLines * 5 + 4);
};

const drawPdfTableRow = (
  doc: jsPDF,
  row: ExportRow,
  columns: TableColumn[],
  columnWidths: number[],
  y: number,
  height: number,
  isHeader = false
) => {
  const margin = 14;
  let x = margin;

  doc.setFont("helvetica", isHeader ? "bold" : "normal");
  doc.setFillColor(isHeader ? 239 : 255, isHeader ? 239 : 255, isHeader ? 239 : 255);

  row.forEach((cell, index) => {
    const width = columnWidths[index];
    doc.rect(x, y, width, height, isHeader ? "FD" : "S");
    addPdfText(
      doc,
      safeText(cell),
      x + 2,
      y + 5,
      width - 4,
      columns[index]?.align ?? "left"
    );
    x += width;
  });
};

const drawPdfSectionHeader = (
  doc: jsPDF,
  section: ExportSection,
  y: number
): number => {
  const columns = getColumns(section);
  const columnWidths = getPdfColumnWidths(section);

  doc.setFont("helvetica", "bold");
  doc.text(section.title, 14, y);
  const headerY = y + 4;
  drawPdfTableRow(
    doc,
    columns.map((column) => column.header),
    columns,
    columnWidths,
    headerY,
    8,
    true
  );

  return headerY + 8;
};

const buildPdfBlob = (
  financeData: FinanceData,
  sections: ExportSection[]
): Blob => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cursor = { y: 16 };
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 14;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(createTitle(financeData), 14, cursor.y);
  cursor.y += 10;
  doc.setFontSize(10);

  sections.forEach((section) => {
    const columns = getColumns(section);
    const columnWidths = getPdfColumnWidths(section);

    if (cursor.y > pageHeight - 32) {
      doc.addPage();
      cursor.y = 16;
    }

    cursor.y = drawPdfSectionHeader(doc, section, cursor.y);

    section.rows.forEach((row) => {
      const rowHeight = getPdfRowHeight(doc, row, columnWidths);

      if (cursor.y + rowHeight > pageHeight - bottomMargin) {
        doc.addPage();
        cursor.y = drawPdfSectionHeader(doc, section, 16);
      }

      drawPdfTableRow(doc, row, columns, columnWidths, cursor.y, rowHeight);
      cursor.y += rowHeight;
    });

    cursor.y += 6;
  });

  return doc.output("blob");
};

export const downloadFinanceDetails = async (
  financeData: FinanceData,
  format: FinanceExportFormat
) => {
  const sections = createExportSections(financeData);
  const fileName = `${getFileBaseName(financeData) || "finance-details"}.${format}`;
  const blob =
    format === "docx"
      ? await buildDocxBlob(financeData, sections)
      : format === "xlsx"
      ? await buildXlsxBlob(financeData, sections)
      : buildPdfBlob(financeData, sections);

  downloadBlobFile(
    blob.type ? blob : new Blob([blob], { type: MIME_TYPES[format] }),
    fileName
  );
};
