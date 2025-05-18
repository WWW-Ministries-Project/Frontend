import coverImage1 from "/src/assets/CoverImage_Gold.svg";
const BannerSkeletonLoader = () => {
    return ( 
        <div className=" flex w-full relative bg-primary text-white rounded-t-lg">
      {/* <img src={props.coverImage1} alt="cover Image" className="w-full rounded-xl" /> */}
      <div
        className="p-4 rounded-t-lg left-0 w-full h-full flex items-center justify-between  bg-cover"
        style={{
          backgroundImage: `url(${coverImage1})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="flex justify-between items-cente  container mx-auto">
        <div className="flex gap-4 items-center  ">
          <div className="h-24 w-24 rounded-full animate-pulse bg-lightGray "></div>
          <article className="xs:hidden md:inline space-y-2">
            
            <div className="h-6 animate-pulse bg-lightGray rounded w-3/5"></div>
            
            
            <div className="animate-pulse flex gap-4 justify-between  w-[40rem]">
            <div className="h-4 bg-lightGray rounded w-2/6"></div>
            <div className="h-4 bg-lightGray rounded w-4/6"></div>
            </div>
            
            
            
            <div className="animate-pulse flex gap-4 justify-between  w-[40rem]">
            <div className="h-4 bg-lightGray rounded w-4/6"></div>
            <div className="h-4 bg-lightGray rounded w-3/6"></div>
            </div>
            
           
            
            <div className="animate-pulse flex gap-4 justify-between  w-[40rem]">
            <div className="h-4 bg-lightGray rounded w-3/6"></div>
            <div className="h-4 bg-lightGray rounded w-3/6"></div>
            </div>
            
            
          </article>
        </div>
        
            <div className="animate-pulse flex gap-4  bg-lightGray rounded h-6 w-1/6 ">
            </div>
        </div>
      </div>
    </div>
     );
}
 
export default BannerSkeletonLoader;