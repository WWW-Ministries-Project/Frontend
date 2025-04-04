import { pictureInstance as axiosFile } from "@/axiosInstance";
import ImageUpload from "@/components/ImageUpload";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { baseUrl } from "@/pages/Authentication/utils/helpers";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import api from "@/utils/apiCalls";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AssetForm from "../Components/AssetForm";
import { assetType } from "../utils/assetsInterface";

const ManageAsset = () => {
  const [file, setFile] = useState<null | Blob>(null);
  const navigate = useNavigate();
  const { postData, loading, error, data } = usePost<{ data: assetType }>(
    api.post.createAsset
  );
  const {
    updateData,
    loading: updateLoading,
    error: updateError,
    data: updatedData,
  } = usePut<{ data: { updatedAsset: assetType } }>(api.put.updateAsset);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("asset_id");
  const isDisabled = location.state?.mode === "view";
  const title = id ? (isDisabled ? "View Asset" : "Update Asset") : "Add Asset";
  const {
    data: asset,
    loading: fetchLoading,
    error: fetchError,
  } = useFetch(api.fetch.fetchAnAsset, { id: id + "" },);
  //@ts-expect-error type should be inside data
  const assetData = useMemo(() => asset?.data.data || { photo: "" }, [asset]);

  useEffect(() => {
    if (data) {
      showNotification("Asset added successfully", "success", () => {
        navigate("/home/assets");
      });
    }
    if (updatedData) {
      showNotification("Asset updated successfully", "success", () => {
        navigate("/home/assets");
      });
    }
    if (error || updateError) {
      showNotification(
        error?.message || updateError?.message || "Something went wrong",
        "error"
      );
    }
  }, [data, error, updatedData, updateError]);
  const handleFormSubmit = async (val: assetType) => {
    try {
      if (file) {
        const data = new FormData();
        data.append("file", file);
        const endpoint = "/upload";
        const path = `${baseUrl}${endpoint}`;
        const response: any = file && (await axiosFile.post(path, data));
        if (file && response.status === 200) {
          const link = response.data.result.link;
          val = { ...val, photo: link };
        }
      }
      if (id) {
        updateData(val);
      } else postData(val);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-4">
      <section className="p-8 container lg:w-4/6 bg-white mx-auto rounded-xl ">
      <h1 className="H700 font-bold text-primary">{title}</h1>
      {!isDisabled && (
        <p className="text-sma text-lightGray py-2">
          Fill in the form below with the asset details
        </p>
      )}
      <div className="hideScrollbar overflow-y-auto">
        <div className="grid md:grid-cols-3 gap-4">
          <ImageUpload
            onFileChange={(file: File) => setFile(file)}
            src={assetData.photo}
            disabled={isDisabled}
          />
        </div>
        <AssetForm
          loading={loading || updateLoading}
          onSubmit={handleFormSubmit}
          initialValues={assetData}
          disabled={isDisabled}
        />
      </div>
      {fetchLoading && <LoaderComponent />}
    </section>
    </div>
  );
};

export default ManageAsset;
