import ChurchLogo from "./ChurchLogo";

const Navbar = () => {
    return ( 
        <div className="h-[10vh] bg-primary flex items-center container p-16 sticky top-0 z-10   w-full ">
                <div className="">
                    <ChurchLogo className={" text-white"} show={true} />
                </div>
            </div>
     );
}
 
export default Navbar;