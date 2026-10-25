import { useEffect, useMemo, useState } from "react";

import { Field, Form, Formik } from "formik";
import { object, string } from "yup";
import {
  XMarkIcon,
  Square3Stack3DIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import type { IProductType } from "@/utils/api/marketPlace/interface";
import { usePost } from "@/CustomHooks/usePost";
import { api } from "@/utils";
import { usePut } from "@/CustomHooks/usePut";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { cn } from "@/utils/cn";

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  categories: IProductType[];
  types: IProductType[];
  refetch: (section: "type" | "category") => void;
}

export const ConfigurationsDrawer = ({
  isOpen,
  onClose,
  categories,
  types,
  refetch,
}: IProps) => {
  const { hasAction } = useAccessControl();
  const canManageCatalog = hasAction("Marketplace.manage_catalog");
  const canDelete = hasAction("Marketplace.delete");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [editItem, setEditItem] = useState<IProductType | null>(null);
  const [count, setCount] = useState(0);

  //create
  const {
    postData: createProducttype,
    data: newProductType,
    loading: isAddingNewType,
  } = usePost(api.post.createProductType);

  const {
    postData: createProductCategory,
    data: newProductCategory,
    loading: isAddingNewTCategory,
  } = usePost(api.post.createProductCategory);

  //update
  const {
    updateData: updateProductType,
    data: typeUpdateData,
    loading: isUpdatingProductType,
  } = usePut(api.put.updateProductType);

  const {
    updateData: updateProductCategory,
    data: categoryUpdateData,
    loading: isUpdatingProductCategory,
  } = usePut(api.put.updateProductCategory);

  //delete
  const { executeDelete: deleteProductType, success } = useDelete(
    api.delete.deleteProductType
  );

  const {
    executeDelete: deleteProductCategory,
    success: deleteCategorySuccess,
  } = useDelete(api.delete.deleteProductCategory);

  const { list } = useMemo(() => {
    const isCategory = activeTab.key === "category";
    return {
      list: isCategory ? categories : types,
    };
  }, [activeTab, categories, types]);

  const handleSubmit = async (data: IProductType) => {
    if (!data.name.trim()) return;

    const isType = activeTab.key === "type";

    if (isType) {
      if (data.id) {
        await updateProductType(data, { id: data.id });
      } else {
        await createProducttype({ name: data.name });
      }
    } else {
      if (data.id) {
        await updateProductCategory(data, { id: data.id });
      } else {
        await createProductCategory({ name: data.name });
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    showDeleteDialog({ id, name }, async () => {
      if (activeTab.key === "type") {
        await deleteProductType({ id: id });
      } else {
        await deleteProductCategory({ id: id });
      }
    });
  };

  useEffect(() => {
    if (newProductType?.data || typeUpdateData?.data || success) {
      refetch("type");

      if (newProductType?.data) {
        showNotification("Product type created successfully", "success");
        setCount((prev) => prev + 1);
      }

      if (typeUpdateData?.data) {
        showNotification("Product type updated successfully", "success");
        setEditItem(null);
      }

      if (success) {
        showNotification("Product type deleted successfully", "success");
      }
    }
  }, [newProductType, refetch, success, typeUpdateData?.data]);

  useEffect(() => {
    if (
      newProductCategory?.data ||
      categoryUpdateData?.data ||
      deleteCategorySuccess
    ) {
      refetch("category");

      if (newProductCategory?.data) {
        showNotification("Product category created successfully", "success");
        setCount((prev) => prev + 1);
      }

      if (categoryUpdateData?.data) {
        showNotification("Product category updated successfully", "success");
        setEditItem(null);
      }

      if (deleteCategorySuccess) {
        showNotification("Product category deleted successfully", "success");
      }
    }
  }, [
    newProductCategory?.data,
    categoryUpdateData?.data,
    deleteCategorySuccess,
    refetch,
  ]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[120] bg-primary/45 transition-opacity duration-300",
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-label="Product settings"
        aria-hidden={!isOpen}
        className={cn(
          "fixed right-0 top-0 z-[121] flex h-[100dvh] w-full flex-col bg-white text-primary shadow-2xl transition-transform duration-300 sm:w-[424px]",
          isOpen ? "translate-x-0" : "invisible translate-x-full"
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-semibold">Product settings</h2>
            <p className="text-sm text-primaryGray">
              Types and categories used to organise products.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-primaryGray hover:bg-gray-100"
          >
            <XMarkIcon className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div
            role="tablist"
            className="flex w-fit gap-1 rounded-lg border border-lightGray bg-lightGray/30 p-1"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={activeTab.key === t.key}
                onClick={() => {
                  setActiveTab(t);
                  setEditItem(null);
                }}
                className={cn(
                  "rounded-md px-4 py-2 text-sm",
                  activeTab.key === t.key
                    ? "bg-white font-semibold shadow-sm"
                    : "text-primaryGray"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="my-5 flex flex-col gap-4">
            <ConfigurationForm
              key={count}
              label={activeTab.label}
              placeholder={`Enter ${activeTab.label.toLowerCase()}`}
              editItem={editItem}
              onSubmit={handleSubmit}
              loading={
                isAddingNewType ||
                isUpdatingProductType ||
                isAddingNewTCategory ||
                isUpdatingProductCategory
              }
              isReadOnly={!canManageCatalog}
            />

            <ul className="flex flex-col gap-2">
              {list.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditItem(item)}
                  onDelete={() => handleDelete(item.id, item.name)}
                  canManageActions={canManageCatalog}
                  canDelete={canDelete}
                />
              ))}
              {list.length === 0 && (
                <li className="rounded-lg border border-dashed border-lightGray p-6 text-center text-sm text-primaryGray">
                  {activeTab.key === "type"
                    ? "No product types yet."
                    : "No categories yet."}
                </li>
              )}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
};

const ItemCard = ({
  item,
  onEdit,
  onDelete,
  canManageActions,
  canDelete,
}: {
  item: IProductType;
  onEdit: () => void;
  onDelete: () => void;
  canManageActions?: boolean;
  canDelete?: boolean;
}) => (
  <li className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm">
    <div className="flex min-w-0 items-center gap-3">
      <Square3Stack3DIcon className="size-5 shrink-0 text-primaryGray" />
      <p className="truncate">{item.name}</p>
    </div>
    {(canManageActions || canDelete) && (
      <div className="flex gap-1">
        {canManageActions && (
          <button
            type="button"
            aria-label={`Edit ${item.name}`}
            onClick={onEdit}
            className="flex size-8 items-center justify-center rounded-lg text-primaryGray hover:bg-gray-100 hover:text-primary"
          >
            <PencilSquareIcon className="size-[18px]" />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            aria-label={`Delete ${item.name}`}
            onClick={onDelete}
            className="flex size-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="size-[18px]" />
          </button>
        )}
      </div>
    )}
  </li>
);

const ConfigurationForm = ({
  label,
  placeholder,
  editItem,
  onSubmit,
  loading,
  isReadOnly = false,
}: {
  label: string;
  placeholder: string;
  editItem: IProductType | null;
  onSubmit: (type: IProductType) => void;
  loading: boolean;
  isReadOnly?: boolean;
}) => {
  const initialValues = editItem || { name: "", id: "" };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={object().shape({
        name: string().trim().required("required"),
      })}
      onSubmit={(values) => {
        onSubmit(values);
      }}
      enableReinitialize
      validateOnBlur={false}
      validateOnChange={false}
    >
      {({ submitForm }) => (
        <Form className="flex items-start gap-3">
          <Field
            name="name"
            id="name"
            component={FormikInputDiv}
            label={label}
            placeholder={placeholder}
            className="w-full"
          />
          <Button
            type="submit"
            value={editItem ? "Update" : "Add"}
            onClick={submitForm}
            className="mt-8"
            loading={loading}
            disabled={isReadOnly}
          />
        </Form>
      )}
    </Formik>
  );
};

const TABS = [
  { key: "type", label: "Product type" },
  { key: "category", label: "Category" },
] as const;
