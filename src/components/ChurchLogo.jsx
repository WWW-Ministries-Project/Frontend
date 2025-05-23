import PropTypes from "prop-types";


function ChurchLogo (props) {


    return (
        <>
            <div className={"flex items-center gap-1.5  " + props.className}>
                <div className="">
                  <img src="/logo/main-logo.svg" alt="logo" />
                </div>
                {props.show&&<div className="flex flex-col gap-1.5">
                  <img src="/assets/authentication/churchName.svg" alt="" />
                  <img src="/assets/authentication/ministries.svg" className="" alt="" />
                </div>}
              </div>
        </>
    )
}

ChurchLogo.propTypes = {
    className: PropTypes.string,
    show: PropTypes.bool,
}
export default ChurchLogo