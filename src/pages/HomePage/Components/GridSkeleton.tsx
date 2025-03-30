import CardWrappers from "@/Wrappers/CardWrapper";
import GridWrapper from "@/Wrappers/GridWrapper";

const GridSkeleton = () => {
  return (
    <GridWrapper>{Array(12).fill(null).map((_, index) => 
        
      <CardWrappers className="animate-pulse  rounded-xl flex gap-2 " key={index}>
        <div className="w-32 h-32 rounded-full bg-lightGray shadow border border-primaryGray animate-pulse " ></div>
        <div className="flex  flex-col gap-2">
          <div className="flex justify-between w-full ">
            <p className="h-12 bg-lightGray rounded animate-pulse w-48"></p>
          </div>
          <div className="flex animate-pulse">
            <p className="text-sm w-32 h-12 bg-lightGray"></p>
          </div>
          <div className="w-32 h-12 bg-lightGray animate-pulse"></div>
          {/* <Button value={"View Profile"} onClick={handleClick} className="w-full mt-2 bg-transparent h-8 border border-primary " /> */}
        </div>
      </CardWrappers>)}
    </GridWrapper>
  );
};

export default GridSkeleton;
