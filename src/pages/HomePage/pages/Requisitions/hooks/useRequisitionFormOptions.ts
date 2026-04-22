import { useMemo } from "react";
import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import useSettingsStore from "../../Settings/utils/settingsStore";
import { api } from "@/utils/api/apiCalls";
import type { EventType } from "@/utils/api/events/interfaces";
import type { DepartmentType } from "@/utils/api/settings/departmentInterfaces";
import type { ApiResponse } from "@/utils/interfaces";
import type { IRequisitionDetails } from "../types/requestInterface";
import type { DropdownOption } from "../types/requisitionForm";

const toOption = (
  label: unknown,
  value: unknown,
): DropdownOption | null => {
  const normalizedLabel = String(label ?? "").trim();

  if (!normalizedLabel || value === null || value === undefined || value === "") {
    return null;
  }

  return {
    label: normalizedLabel,
    value: value as string | number,
  };
};

const dedupeOptions = (options: DropdownOption[]): DropdownOption[] => {
  const seenValues = new Set<string>();

  return options.filter((option) => {
    const key = String(option.value);

    if (!key || seenValues.has(key)) {
      return false;
    }

    seenValues.add(key);
    return true;
  });
};

export const useRequisitionFormOptions = (
  requestData?: IRequisitionDetails | null,
) => {
  const { departments: storedDepartments } = useSettingsStore((state) => ({
    departments: state.departments,
  }));

  const { events: storedEvents } = useStore((state) => ({
    events: state.events,
  }));

  const { data: departmentsData, loading: departmentsLoading } = useFetch<
    ApiResponse<DepartmentType[]>
  >(
    api.fetch.fetchDepartments as (
      query?: Record<string, string | number>,
    ) => Promise<ApiResponse<DepartmentType[]>>,
  );

  const { data: eventsData, loading: eventsLoading } = useFetch<
    ApiResponse<EventType[]>
  >(
    api.fetch.fetchAllUniqueEvents as (
      query?: Record<string, string | number>,
    ) => Promise<ApiResponse<EventType[]>>,
  );

  const departmentOptions = useMemo(() => {
    const source =
      departmentsData?.data?.length && departmentsData.data.length > 0
        ? departmentsData.data
        : storedDepartments;

    const mapped = source
      .map((department) => toOption(department?.name, department?.id))
      .filter((option): option is DropdownOption => Boolean(option));

    const requestDepartmentId = requestData?.summary?.department_id;
    const requestDepartment = requestData?.summary?.department;

    if (
      requestDepartmentId &&
      !mapped.some((option) => String(option.value) === String(requestDepartmentId))
    ) {
      const fallback = toOption(
        requestDepartment || `Department ${requestDepartmentId}`,
        requestDepartmentId,
      );

      if (fallback) {
        mapped.push(fallback);
      }
    }

    return dedupeOptions(mapped);
  }, [departmentsData?.data, requestData?.summary, storedDepartments]);

  const eventOptions = useMemo(() => {
    const source =
      eventsData?.data?.length && eventsData.data.length > 0
        ? eventsData.data
        : storedEvents;

    const mapped = source
      .map((event) => {
        const normalizedEvent = event as {
          id?: string | number;
          name?: string;
          event_name?: string;
          event_name_id?: string | number;
        };

        const label = normalizedEvent?.name ?? normalizedEvent?.event_name ?? "";
        const value = normalizedEvent?.id ?? normalizedEvent?.event_name_id ?? "";

        return toOption(label, value);
      })
      .filter((option): option is DropdownOption => Boolean(option));

    const requestProgramId = requestData?.summary?.program_id;
    const requestProgramName = requestData?.summary?.program;

    if (
      requestProgramId &&
      !mapped.some((option) => String(option.value) === String(requestProgramId))
    ) {
      const fallback = toOption(
        requestProgramName || `Event ${requestProgramId}`,
        requestProgramId,
      );

      if (fallback) {
        mapped.push(fallback);
      }
    }

    return dedupeOptions(mapped);
  }, [eventsData?.data, requestData?.summary, storedEvents]);

  const currencies = useMemo(
    () =>
      [
        { label: "Ghana Cedi (GHS)", value: "GHS" },
        { label: "US Dollar (USD)", value: "USD" },
        { label: "Euro (EUR)", value: "EUR" },
        { label: "British Pound Sterling (GBP)", value: "GBP" },
        { label: "Japanese Yen (JPY)", value: "JPY" },
      ] as DropdownOption[],
    [],
  );

  return {
    departmentOptions,
    eventOptions,
    currencies,
    departmentsLoading,
    eventsLoading,
  };
};
