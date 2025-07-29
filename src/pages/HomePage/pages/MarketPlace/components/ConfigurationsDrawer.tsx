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
import { FormikInputDiv } from "@/components/FormikInputDiv";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import type { IProductType } from "@/utils/api/marketPlace/interface";
import { usePost } from "@/CustomHooks/usePost";
import { api } from "@/utils";
import { usePut } from "@/CustomHooks/usePut";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog } from "@/pages/HomePage/utils";

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  categories: IProductType[];
  types: IProductType[];
  onUpdateCategories: (items: IProductType[]) => void;
  onUpdateTypes: (items: IProductType[]) => void;
  refetch: (section: "type" | "category") => void;
}

export const ConfigurationsDrawer = ({
  isOpen,
  onClose,
  categories,
  types,
  onUpdateCategories,
  onUpdateTypes,
  refetch,
}: IProps) => {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [editItem, setEditItem] = useState<IProductType | null>(null);

  const {
    postData: createProducttype,
    data: newProductType,
    loading: isAddingNewType,
  } = usePost(api.post.createProductType);

  const {
    updateData: updateProductType,
    data: typeUpdateData,
    loading: isUpdatingProductType,
  } = usePut(api.put.updateProductType);

  const { executeDelete: deleteProductType, success } = useDelete(
    api.delete.deleteProductType
  );

  const { list } = useMemo(() => {
    const isCategory = activeTab.key === "category";
    return {
      list: isCategory ? categories : types,
    };
  }, [activeTab, categories, types, onUpdateCategories, onUpdateTypes]);

  const handleSubmit = async (type: IProductType) => {
    if (!type.name.trim()) return;

    const isType = activeTab.key === "type";

    if (isType) {
      if (type.id) {
        updateProductType(type, { id: type.id });
      } else {
        await createProducttype({ name: type.name });
      }
    }
  };

  const handleDelete = (id: string, name: string) => {
    showDeleteDialog({ id, name }, async () => {
      await deleteProductType({ id: id });
    });
  };

  useEffect(() => {
    if (newProductType?.data) {
      refetch("type");
    }
  }, [newProductType]);

  useEffect(() => {
    if (typeUpdateData) {
      refetch("type");
      setEditItem(null);
    }
  }, [typeUpdateData]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 -right-10 h-screen w-[424px] xs:w-[100%] sm:w-[400px] md:w-[424px]  bg-white shadow-lg z-50 transition-transform duration-300 text-[#474D66] ${
          isOpen ? "-translate-x-4" : "translate-x-full"
        }`}
      >
        <header className="p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Configurations</h2>
          <XMarkIcon className="w-5 cursor-pointer" onClick={onClose} />
        </header>

        <div className="p-4 overflow-y-auto">
          <TabSelection
            selectedTab={activeTab.label}
            tabs={TABS.map((t) => t.label)}
            onTabSelect={(label) => {
              const selected = TABS.find((t) => t.label === label);
              if (selected) setActiveTab(selected);
            }}
          />

          <div className="my-5">
            <ConfigurationForm
              label={activeTab.label}
              placeholder={`Enter ${activeTab.label.toLowerCase()}`}
              editItem={editItem}
              onSubmit={handleSubmit}
              loading={isAddingNewType || isUpdatingProductType}
            />

            {list.length > 0 && <HorizontalLine />}

            <ul className="space-y-4 h-[60vh] overflow-y-scroll ">
              {list.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditItem(item)}
                  onDelete={() => handleDelete(item.id, item.name)}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

const ItemCard = ({
  item,
  onEdit,
  onDelete,
}: {
  item: IProductType;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <li className="flex justify-between items-center p-4 border rounded-lg ">
    <div className="flex items-center gap-4">
      <Square3Stack3DIcon className="w-6" />
      <p>{item.name}</p>
    </div>
    <div className="flex gap-2">
      <PencilSquareIcon className="w-5 cursor-pointer" onClick={onEdit} />
      <TrashIcon
        className="w-5 text-red-500 cursor-pointer"
        onClick={onDelete}
      />
    </div>
  </li>
);

const ConfigurationForm = ({
  label,
  placeholder,
  editItem,
  onSubmit,
  loading,
}: {
  label: string;
  placeholder: string;
  editItem: IProductType | null;
  onSubmit: (type: IProductType) => void;
  loading: boolean;
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
          />
        </Form>
      )}
    </Formik>
  );
};

const TABS = [
  { key: "type", label: "Product Type" },
  { key: "category", label: "Product Category" },
] as const;
