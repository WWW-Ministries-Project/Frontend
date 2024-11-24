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

const AddAsset = () => {
  const [file, setFile] = useState<null | Blob>(null);
  const { postData, loading, error, data } = UsePost<{ data: assetType[] }>(
    api.post.createAsset
  );
  const assetsStore = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      assetsStore.setAssets(data?.data);
      setFile(null);
      showNotification("Asset added successfully", () => {
        navigate("/home/assets");
      });
      if (error) {
        showNotification("Something went wrong");
      }
    }
  }, [data, error]);
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
      postData(val);
    } catch (error) {
      console.log(error);
    }
    //   if (editMode) {
    //     axios
    //       .put(`${baseUrl}/assets/update-asset`, inputValueRef.current)
    //       .then((res) => {
    //         setLoading(false);
    //         // setData(res.data.data);
    //         setAssertsData(prev => prev.map(data => {
    //           if (data.id !== res.data.updatedAsset) return data
    //           else return res.data.updatedAsset
    //         }))
    //         setDisplayForm(false);
    //         setEditMode(false);
    //         setInputValue({ name: "", description: "", date_purchased: "", status: "", price: "" });
    //       })
    //       .catch((err) => {
    //         console.log(err);
    //         setLoading(false);
    //       });
    //   }
    //   else {
    //     axios
    //       .post(`${baseUrl}/assets/create-asset`, inputValueRef.current)
    //       .then((res) => {
    //         setLoading(false);
    //         // setData(res.data.data);
    //         setAssertsData(prev => [res.data.asset, ...prev]);
    //         setDisplayForm(false);
    //         setInputValue({ name: "", description: "", date_purchased: "", status: "", price: "" });
    //       })
    //       .catch((err) => {
    //         console.log(err);
    //         setLoading(false);
    //       });
    //   }

    // } catch (error) {
    //   setLoading(false);
    //   console.log(error);
    // }
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

        {/* <AssetForm inputValue={inputValue=''} onSubmit={handleSubmit} loading={loading} updating={id ? true : false} /> */}
        <AssetForm loading={loading} onSubmit={handleFormSubmit} />
      </div>
    </section>
  );
};

export default AddAsset;
