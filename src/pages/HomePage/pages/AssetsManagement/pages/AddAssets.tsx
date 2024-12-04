import { pictureInstance as axiosFile } from "@/axiosInstance";
import ImageUpload from "@/components/ImageUpload";
import UsePost from "@/CustomHooks/usePost";
import { baseUrl } from "@/pages/Authentication/utils/helpers";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import { useStore } from "@/store/useStore";
import api from "@/utils/apiCalls";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AssetForm from "../Components/AssetForm";
import { assetType } from "../utils/assetsInterface";
import usePut from "@/CustomHooks/usePut";

const AddAsset = () => {
  const [file, setFile] = useState<null | Blob>(null);
  const navigate = useNavigate();
  const { postData, loading, error, data } = UsePost<{ data: assetType}>(
    api.post.createAsset
  );
  const { updateData, loading: updateLoading, error: updateError, data: updatedData } = usePut<{ data: assetType}>(api.put.updateAsset);
  const query = location.search;
  const params = new URLSearchParams(query);
  const id = params.get("asset_id");
  const assetsStore = useStore();

  useEffect(() => {
    if (data) {
      assetsStore.addAsset(data?.data);
      showNotification("Asset added successfully","success", () => {
        navigate("/home/assets");
      });
      if(updatedData) {
        assetsStore.updateAsset(updatedData?.data);
        showNotification("Asset updated successfully","success", () => {
          navigate("/home/assets");
        });
      }
      if (error || updateError) {
        showNotification("Something went wrong", "error");
      }
    }
  }, [data, error, updatedData, updateError]);
  const handleFormSubmit = async (val: any) => {
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
      }else postData(val);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section className="py-8 px-16 lg:container lg:w-4/6 bg-white mx-auto rounded-xl shadow">
      <h1 className="H700 font-bold text-dark900">Add Asset</h1>
      <p className="text-sma text-lightGray py-2">
        Fill in the form below with the asset details
      </p>
      <div className="hideScrollbar overflow-y-auto">
        <div className="grid md:grid-cols-3 gap-4">
          <ImageUpload onFileChange={(file: File) => setFile(file)} />
        </div>
        <AssetForm loading={loading || updateLoading} onSubmit={handleFormSubmit} initialValues={assetsStore.activeAsset} />
      </div>
    </section>
  );
};

export default AddAsset;
