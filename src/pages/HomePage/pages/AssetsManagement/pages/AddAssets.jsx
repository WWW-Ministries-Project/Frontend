import ImageUpload from "@/components/ImageUpload";
import { useEffect, useState } from "react";
import AssetForm from "../Components/AssetForm";

const AddAsset = () => {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);

    
    return ( 
        <section className="p-8 lg:container  bg-white mx-auto">
        <h1 className="H700">Add Asset</h1>
        <p className="text-sma text-lightGray py-2">
          Fill in the form below with the asset details
        </p>
        <div className="hideScrollbar overflow-y-auto">
          <ImageUpload onFileChange={(file) => setFile(file)} />
  
          {/* <AssetForm inputValue={inputValue} onSubmit={handleSubmit} loading={loading} updating={id ? true : false} /> */}
        </div>
      </section>
     );
}
 
export default AddAsset;