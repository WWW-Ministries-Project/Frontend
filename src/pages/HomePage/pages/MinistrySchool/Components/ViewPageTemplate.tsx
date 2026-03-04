import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { Outlet } from "react-router-dom";
import { ViewPageProvider } from "../customHooks/ViewPageContext";
import { useViewPage } from "../customHooks/useViewPage";
import { Banner } from "../../Members/Components/Banner";

const ViewPageTemplateInner = () => {
  const { loading, data, details } = useViewPage();

  return (
    <div>
      <section className="sticky top-0 z-20">
        <Banner>
          <div className="w-full space-y-4">
            <div>
              <div className="flex items-center justify-between">
                {loading ? (
                  <div className="flex w-[40rem] animate-pulse justify-between">
                    <div className="h-6 w-3/5 rounded bg-lightGray" />
                    <div className="h-4 w-1/6 rounded bg-lightGray" />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-white">{data?.title || data?.user?.name}</h1>
                )}
              </div>

              {!loading && data?.description && (
                <div className="text-sm">
                  <p>{data.description}</p>
                </div>
              )}
            </div>

            {loading && details ? (
              <div className="space-y-2 animate-pulse">
                <div className="flex gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <div className="h-4 w-20 rounded bg-lightGray" />
                      <div className="h-4 w-28 rounded bg-lightGray" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>{details}</div>
            )}
          </div>
        </Banner>
      </section>
      <PageOutline className="p-0">
      

      <section>
        <div className="">
          <Outlet />
        </div>
      </section>
    </PageOutline>
    </div>
  );
};

const ViewPageTemplate = () => (
  <ViewPageProvider>
    <ViewPageTemplateInner />
  </ViewPageProvider>
);

export default ViewPageTemplate;
