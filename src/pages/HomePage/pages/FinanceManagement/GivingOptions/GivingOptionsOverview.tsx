import { Modal } from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { GivingOption } from "@/utils/api/finance/interface";
import { cn } from "@/utils/cn";
import React from "react";
import GivingOptionCard from "./components/GivingOptionCard";
import GivingOptionForm from "./components/GivingOptionForm";

type StatusFilter = "active" | "archived";

const GivingOptionsOverview = () => {
  const [openModal, setOpenModal] = React.useState(false);
  const [selectedOption, setSelectedOption] =
    React.useState<GivingOption | null>(null);
  const [statusFilter, setStatusFilter] =
    React.useState<StatusFilter>("active");

  // Archived rows are only ever fetched when the archived tab is showing, so the
  // default view stays a plain list of live options.
  const { data, loading, refetch } = useFetch(api.fetch.fetchGivingOptions, {
    include_archived: statusFilter === "archived" ? "true" : "false",
  });

  const { executeDelete, success } = useDelete(api.delete.archiveGivingOption);

  const givingOptions = React.useMemo<GivingOption[]>(() => {
    const rows = Array.isArray(data?.data) ? data.data : [];

    return statusFilter === "archived"
      ? rows.filter((option) => Boolean(option.archived_at))
      : rows.filter((option) => !option.archived_at);
  }, [data, statusFilter]);

  const closeModal = () => {
    setOpenModal(false);
    setSelectedOption(null);
  };

  const handleArchive = async (id: string | number) => {
    await executeDelete({ id: String(id) });
  };

  const handleRestore = async (option: GivingOption) => {
    try {
      await api.put.restoreGivingOption({}, { id: option.id });
      showNotification("Giving option restored successfully", "success");
      await refetch();
    } catch (error) {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;

      showNotification(
        message || "Unable to restore the giving option",
        "error"
      );
    }
  };

  React.useEffect(() => {
    if (success) {
      refetch();
      showNotification("Giving option archived successfully", "success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Manage Giving Options"
        buttonValue="Create giving option"
        onClick={() => {
          setSelectedOption(null);
          setOpenModal(true);
        }}
      />

      <div className="flex gap-2">
        {(["active", "archived"] as StatusFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              statusFilter === filter
                ? "bg-primary text-white"
                : "bg-lightGray/40 text-primaryGray hover:bg-lightGray/70"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
          Loading giving options...
        </p>
      ) : givingOptions.length === 0 ? (
        <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
          {statusFilter === "archived"
            ? "No archived giving options."
            : "No giving options yet. Create one to start collecting through Paystack."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {givingOptions.map((option) => (
            <GivingOptionCard
              key={option.id}
              givingOption={option}
              onEdit={() => {
                setSelectedOption(option);
                setOpenModal(true);
              }}
              onArchive={() =>
                showDeleteDialog(
                  { name: option.name, id: option.id },
                  handleArchive
                )
              }
              onRestore={() => handleRestore(option)}
            />
          ))}
        </div>
      )}

      <Modal open={openModal} onClose={closeModal} className="max-w-2xl">
        <GivingOptionForm
          onClose={closeModal}
          onSaved={refetch}
          initialData={selectedOption ?? undefined}
        />
      </Modal>
    </div>
  );
};

export default GivingOptionsOverview;
