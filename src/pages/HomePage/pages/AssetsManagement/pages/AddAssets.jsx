import ImageUpload from "@/components/ImageUpload";
import { useEffect, useState } from "react";
import AssetForm from "../Components/AssetForm";

const AddAsset = () => {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
      return console.log("hello");
      
    }
    const id=1

    
    return ( 
        <section className="py-8 px-16 lg:container lg:w-4/6 bg-white mx-auto rounded-xl shadow">
        <h1 className="H700 font-bold text-dark900">Add Asset</h1>
        <p className="text-sma text-lightGray py-2">
          Fill in the form below with the asset details
        </p>
        <div className="hideScrollbar overflow-y-auto">
        <div className="grid md:grid-cols-3 gap-4">
          
          <ImageUpload onFileChange={(file) => setFile(file)} />
            </div>
  
          {/* <AssetForm inputValue={inputValue=''} onSubmit={handleSubmit} loading={loading} updating={id ? true : false} /> */}
          <AssetForm  />
        </div>
      </section>
     );
}
 
export default AddAsset;