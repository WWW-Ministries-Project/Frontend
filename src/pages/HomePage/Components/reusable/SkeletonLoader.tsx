const SkeletonLoader = ({no=9}) => {
    return ( 
        <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2 ">
            {Array.from({ length: no }).map((_, index) => (
            //   <SkeletonLoader key={`skeleton-${index}`} />
              <div key={`skeleton-${index}`} className="animate-pulse border border-1 border-lightGray p-4 rounded-lg space-y-3 text-dark900 flex flex-col">
      <div className="flex  justify-between">
      <div className="h-6 bg-lightGray rounded w-3/5"></div>
      <div className="h-4 bg-lightGray rounded w-1/5"></div>
      </div>
      <div className="h-4 bg-lightGray rounded w-1/2"></div>
      <div className="h-4 bg-lightGray rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-lightGray rounded w-2/3"></div>
        <div className="h-4 bg-lightGray rounded w-1/2"></div>
      </div>
      <div className="flex justify-between space-x-2">
        <div className="h-10 bg-lightGray rounded w-1/3"></div>
        <div className="h-10 bg-lightGray rounded w-1/3"></div>
      </div>
    </div>
            ))}
          </div>
        
     );
}
 
export default SkeletonLoader;