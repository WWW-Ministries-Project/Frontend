import { pictureInstance as axiosFile } from "@/axiosInstance";
import ImageUpload from "@/components/ImageUpload";
import UsePost from "@/CustomHooks/usePost";
import { baseUrl } from "@/pages/Authentication/utils/helpers";
import api from "@/utils/apiCalls";
import { useState } from "react";
import AssetForm from "../Components/AssetForm";

const AddAsset = () => {
  const [file, setFile] = useState<null | Blob>(null);
  const { postData, loading } = UsePost(api.post.createAsset);
  const handleFormSubmit = async (val: any) => {
    console.log(val);
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
          setFile(null);
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
