import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import DeleteIcon from "@/assets/DeleteIcon";
import { Button } from "@/components";

const TableHeader = ({
  header,
  className = "",
}: {
  header: string;
  className?: string;
}) => (
  <th className={`border border-lightGray bg-[#F8F9FC] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary ${className}`}>
    {header}
  </th>
);

const TableData = ({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) => (
  <td
    className={`border border-lightGray px-3 py-2 ${className}`}
    colSpan={colSpan}
  >
    {children}
  </td>
);

const TableInput = ({
  type,
  value,
  onChange,
  disabled,
  className = "",
}: {
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  className?: string;
}) => (
  <input
    type={type}
    className={`app-input min-h-9 border-none bg-transparent px-2 py-1 ${className}`}
    value={value}
    onChange={onChange}
    disabled={disabled}
    min={type === "number" ? 0 : undefined}
    step={type === "number" ? "any" : undefined}
  />
);

interface TableRow {
  name: string;
  quantity: number;
  amount: number;
  total: number;
  id: string | number;
  image_url?: string;
}

interface EditableTableProps {
  isEditable?: boolean;
  data?: TableRow[];
  onImageUpload?: (file: File) => Promise<string | null>;
  imageUploadLoading?: boolean;
}

const EditableTable: React.FC<EditableTableProps> = ({
  isEditable = true,
  data,
  onImageUpload,
  imageUploadLoading = false,
}) => {
  const { addRow, deleteRow, rows, updateRow, setInitialRows } = useStore();
  const [uploadingRowId, setUploadingRowId] = useState<string | number | null>(
    null
  );

  useEffect(() => {
    if (data) {
      setInitialRows(data);
    }
  }, [data, setInitialRows]);

  const handleInputChange = (
    index: number,
    field: keyof TableRow,
    value: string
  ) => {
    updateRow(index, field, value);
  };

  const totalSum = useMemo(
    () => rows.reduce((sum, row) => sum + row.total, 0),
    [rows]
  );

  const handleImageChange = async (index: number, file: File | null) => {
    if (!file || !isEditable || !onImageUpload) return;

    const rowId = rows[index]?.id ?? null;
    setUploadingRowId(rowId);

    try {
      const imageUrl = await onImageUpload(file);
      if (imageUrl) {
        handleInputChange(index, "image_url", imageUrl);
      }
    } finally {
      setUploadingRowId(null);
    }
  };

  const formatAmount = (value: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
  };

  const textPosition = isEditable ? "text-left" : "text-center";
  const fieldLabelClass =
    "text-[11px] font-semibold uppercase tracking-wide text-primaryGray";
  const renderImageControls = (
    row: TableRow,
    index: number,
    className = "flex items-center justify-center gap-2"
  ) => (
    <div className={className}>
      {row.image_url ? (
        <img
          src={row.image_url}
          alt={`${row.name || "Item"} preview`}
          className="h-12 w-12 rounded-md border border-lightGray object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-lightGray text-[10px] text-primaryGray">
          No image
        </div>
      )}

      {isEditable && (
        <div className="flex flex-col items-start gap-1">
          <input
            id={`item-image-${row.id}-${index}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleImageChange(index, event.target.files?.[0] ?? null)
            }
          />
          <label
            htmlFor={`item-image-${row.id}-${index}`}
            className="cursor-pointer text-xs font-medium text-primary hover:underline"
          >
            {row.image_url ? "Replace image" : "Upload image"}
          </label>
          {row.image_url && (
            <button
              type="button"
              onClick={() => handleInputChange(index, "image_url", "")}
              className="text-xs text-error hover:underline"
            >
              Remove
            </button>
          )}
          {imageUploadLoading && uploadingRowId === row.id && (
            <span className="text-xs text-primaryGray">Uploading...</span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="py-4">
      {isEditable && (
        <div className="mb-3 flex items-center justify-end">
          <Button
            value="+ Add item"
            variant="secondary"
            className="font-semibold"
            onClick={addRow}
          />
        </div>
      )}
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-lightGray">
          <div className="laptop:hidden">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className={`space-y-3 border-b border-lightGray p-4 ${
                  index % 2 === 0 ? "bg-white" : "bg-[#FAFBFD]"
                }`}
              >
                <div className="space-y-1">
                  <p className={fieldLabelClass}>Name</p>
                  <TableInput
                    type="text"
                    value={row.name}
                    onChange={(e) =>
                      handleInputChange(index, "name", e.target.value)
                    }
                    disabled={!isEditable}
                    className="w-full min-w-0"
                  />
                </div>

                <div className="grid gap-3 tablet:grid-cols-2">
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>Quantity</p>
                    <TableInput
                      type="number"
                      value={row.quantity}
                      onChange={(e) =>
                        handleInputChange(index, "quantity", e.target.value)
                      }
                      disabled={!isEditable}
                      className={textPosition}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>Amount</p>
                    <TableInput
                      type="number"
                      value={row.amount}
                      onChange={(e) =>
                        handleInputChange(index, "amount", e.target.value)
                      }
                      disabled={!isEditable}
                      className={textPosition}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className={fieldLabelClass}>Total</p>
                  <p className="app-input min-h-9 border-none bg-transparent px-2 py-1 font-medium">
                    {formatAmount(row.total)}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className={fieldLabelClass}>Image</p>
                  {renderImageControls(
                    row,
                    index,
                    "flex items-center justify-start gap-3"
                  )}
                </div>

                {isEditable && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteRow(index)}
                      className="text-xs font-semibold text-error hover:underline"
                    >
                      Remove item
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between bg-[#F8F9FC] px-4 py-3 text-sm font-semibold text-primary">
              <span>Total</span>
              <span>{formatAmount(totalSum)}</span>
            </div>
          </div>

          <div className="hidden overflow-x-auto laptop:block">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <TableHeader header="Name" className="min-w-[260px] text-left" />
                  <TableHeader header="Quantity" className={textPosition} />
                  <TableHeader header="Amount" className={textPosition} />
                  <TableHeader
                    header="Total"
                    className="min-w-[110px] text-center"
                  />
                  <TableHeader
                    header="Image"
                    className="min-w-[180px] text-center"
                  />
                  {isEditable && (
                    <TableHeader header="Remove" className="text-center" />
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="odd:bg-white even:bg-[#FAFBFD]">
                    <TableData className="min-w-[260px]">
                      <TableInput
                        type="text"
                        value={row.name}
                        onChange={(e) =>
                          handleInputChange(index, "name", e.target.value)
                        }
                        disabled={!isEditable}
                        className="w-full min-w-[220px]"
                      />
                    </TableData>
                    <TableData>
                      <TableInput
                        type="number"
                        value={row.quantity}
                        onChange={(e) =>
                          handleInputChange(index, "quantity", e.target.value)
                        }
                        disabled={!isEditable}
                        className={textPosition}
                      />
                    </TableData>
                    <TableData>
                      <TableInput
                        type="number"
                        value={row.amount}
                        onChange={(e) =>
                          handleInputChange(index, "amount", e.target.value)
                        }
                        disabled={!isEditable}
                        className={textPosition}
                      />
                    </TableData>
                    <TableData className="text-center font-medium">
                      {formatAmount(row.total)}
                    </TableData>
                    <TableData>{renderImageControls(row, index)}</TableData>
                    {isEditable && (
                      <TableData className="text-center">
                        <DeleteIcon onClick={() => deleteRow(index)} />
                      </TableData>
                    )}
                  </tr>
                ))}
                <tr className="font-semibold">
                  <TableData colSpan={3} className="pl-3.5">
                    Total
                  </TableData>
                  <TableData className="text-center">
                    {formatAmount(totalSum)}
                  </TableData>
                  <TableData />
                  {isEditable && <TableData />}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableTable;
