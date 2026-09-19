import { useEffect, useMemo, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import SermonCard from "./Components/SermonCard";
import SermonSeriesCard from "./Components/SermonSeriesCard";
import SermonForm from "./Components/SermonForm";
import SeriesForm from "./Components/SeriesForm";
import { Modal } from "@/components/Modal";
import { SelectField } from "../../Components/reusable/SelectField";
import { api } from "@/utils/api/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import { showDeleteDialog, showNotification } from "../../utils";
import EmptyState from "@/components/EmptyState";
import type {
  Sermon,
  SermonSeries,
  SermonTag,
} from "@/utils/api/sermons/interfaces";

type Tab = "sermons" | "series";

const SermonManager = () => {
  const [activeTab, setActiveTab] = useState<Tab>("sermons");

  const [sermonFormOpen, setSermonFormOpen] = useState(false);
  const [seriesFormOpen, setSeriesFormOpen] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SermonSeries | null>(
    null
  );
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [seriesFilter, setSeriesFilter] = useState<number | "">("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // branch_id is injected by branchScope.ts (Task B2 Step 5), and useFetch
  // re-runs whenever the active branch changes, so no query is passed here.
  const {
    data: sermonsData,
    loading: sermonsLoading,
    refetch: refetchSermons,
  } = useFetch(api.fetch.fetchSermons);

  const { data: seriesData, refetch: refetchSeries } = useFetch(
    api.fetch.fetchSermonSeries
  );

  const { data: tagsData } = useFetch(api.fetch.fetchSermonTags);

  const sermons: Sermon[] = useMemo(
    () => (Array.isArray(sermonsData?.data) ? sermonsData.data : []),
    [sermonsData]
  );

  const series: SermonSeries[] = useMemo(
    () => (Array.isArray(seriesData?.data) ? seriesData.data : []),
    [seriesData]
  );

  const tags: SermonTag[] = useMemo(
    () => (Array.isArray(tagsData?.data) ? tagsData.data : []),
    [tagsData]
  );

  // Filtering is client-side: the endpoint supports the same filters, but the
  // list is small and filtering locally keeps the grid responsive without a
  // round trip per keystroke.
  const visibleSermons = useMemo(
    () =>
      sermons.filter((sermon) => {
        if (seriesFilter !== "" && sermon.series_id !== seriesFilter) {
          return false;
        }
        if (statusFilter && sermon.status !== statusFilter) return false;
        if (tagFilter && !sermon.tags?.some((tag) => tag.slug === tagFilter)) {
          return false;
        }
        return true;
      }),
    [sermons, seriesFilter, statusFilter, tagFilter]
  );

  const deleteSermon = async (id: string | number) => {
    try {
      await api.delete.deleteSermon(Number(id));
      showNotification("Sermon deleted", "success");
      refetchSermons();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Delete sermon failed", error);
      showNotification("The sermon could not be deleted.", "error", "Sermons");
    }
  };

  const deleteSeries = async (id: string | number) => {
    try {
      await api.delete.deleteSermonSeries(Number(id));
      showNotification("Series deleted", "success");
      refetchSeries();
      refetchSermons();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Delete series failed", error);
      showNotification("The series could not be deleted.", "error", "Sermons");
    }
  };

  const togglePublish = async (item: Sermon) => {
    setTogglingId(item.id);
    try {
      if (item.status === "PUBLISHED") {
        await api.post.unpublishSermon(item.id);
        showNotification("Sermon unpublished", "success");
      } else {
        await api.post.publishSermon(item.id);
        showNotification("Sermon published", "success");
      }
      refetchSermons();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Toggle publish failed", error);
      showNotification(
        "The sermon status could not be updated. Please try again.",
        "error",
        "Sermons"
      );
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    // A series the user just deleted must not stay selected as a filter.
    if (seriesFilter !== "" && !series.some((s) => s.id === seriesFilter)) {
      setSeriesFilter("");
    }
  }, [series, seriesFilter]);

  const isSermonsTab = activeTab === "sermons";

  return (
    <PageOutline>
      <HeaderControls
        title="Sermons"
        subtitle="Create and manage sermons for members"
        btnName={isSermonsTab ? "Add sermon" : "Add series"}
        hasSearch={false}
        screenWidth={window.innerWidth}
        handleClick={() => {
          if (isSermonsTab) {
            setSelectedSermon(null);
            setSermonFormOpen(true);
          } else {
            setSelectedSeries(null);
            setSeriesFormOpen(true);
          }
        }}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("sermons")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            isSermonsTab
              ? "bg-primary text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Sermons ({sermons.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("series")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            !isSermonsTab
              ? "bg-primary text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Series ({series.length})
        </button>
      </div>

      {isSermonsTab ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              id="filter-series"
              placeholder="All series"
              value={seriesFilter}
              clearable
              searchable
              options={series.map((item) => ({
                value: item.id,
                label: item.title,
              }))}
              onChange={(_name, value) =>
                setSeriesFilter(value === null ? "" : Number(value))
              }
            />

            <SelectField
              id="filter-tag"
              placeholder="All tags"
              value={tagFilter}
              clearable
              searchable
              options={tags.map((tag) => ({
                value: tag.slug,
                label: tag.name,
              }))}
              onChange={(_name, value) => setTagFilter(String(value ?? ""))}
            />

            <SelectField
              id="filter-status"
              placeholder="All statuses"
              value={statusFilter}
              clearable
              options={[
                { value: "PUBLISHED", label: "Published" },
                { value: "DRAFT", label: "Draft" },
              ]}
              onChange={(_name, value) => setStatusFilter(String(value ?? ""))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleSermons.map((item) => (
              <SermonCard
                key={item.id}
                item={item}
                toggling={togglingId === item.id}
                onEdit={() => {
                  setSelectedSermon(item);
                  setSermonFormOpen(true);
                }}
                onTogglePublish={() => togglePublish(item)}
                onDelete={() =>
                  showDeleteDialog(
                    { name: item.title ?? "Sermon", id: item.id },
                    deleteSermon
                  )
                }
              />
            ))}
          </div>

          {!sermonsLoading && visibleSermons.length === 0 && (
            <EmptyState
              scope="page"
              msg={
                sermons.length === 0
                  ? "No sermons yet"
                  : "No sermons match these filters"
              }
              description={
                sermons.length === 0
                  ? "Add your first sermon to share it with members."
                  : "Clear a filter to see more sermons."
              }
            />
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {series.map((item) => (
            <SermonSeriesCard
              key={item.id}
              item={item}
              onEdit={() => {
                setSelectedSeries(item);
                setSeriesFormOpen(true);
              }}
              onDelete={() =>
                showDeleteDialog(
                  { name: item.title ?? "Series", id: item.id },
                  deleteSeries
                )
              }
            />
          ))}

          {series.length === 0 && (
            <EmptyState
              scope="page"
              msg="No series yet"
              description="A series groups related sermons together."
            />
          )}
        </div>
      )}

      <Modal
        open={sermonFormOpen}
        onClose={() => {
          setSermonFormOpen(false);
          setSelectedSermon(null);
        }}
        title="Sermon"
      >
        <SermonForm
          sermon={selectedSermon}
          onClose={() => {
            setSermonFormOpen(false);
            setSelectedSermon(null);
          }}
          onSaved={() => {
            refetchSermons();
            refetchSeries();
          }}
        />
      </Modal>

      <Modal
        open={seriesFormOpen}
        onClose={() => {
          setSeriesFormOpen(false);
          setSelectedSeries(null);
        }}
        title="Series"
      >
        <SeriesForm
          series={selectedSeries}
          onClose={() => {
            setSeriesFormOpen(false);
            setSelectedSeries(null);
          }}
          onSaved={() => refetchSeries()}
        />
      </Modal>
    </PageOutline>
  );
};

export default SermonManager;
