import PropTypes from "prop-types";
import churchNameWordmark from "/assets/authentication/churchName.svg?raw";
import ministriesWordmark from "/assets/authentication/ministries.svg?raw";


function ChurchLogo (props) {


    return (
        <>
            <div className={"flex items-center gap-1.5 " + (props.className || "")}>
                <div className="">
                  <img src="/logo/main-logo.svg" alt="Worldwide Word Ministries logo" />
                </div>
                {props.show&&<div className="flex flex-col gap-1.5 text-primary">
                  <span
                    className="leading-none [&>svg]:block"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: churchNameWordmark }}
                  />
                  <span
                    className="leading-none [&>svg]:block"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: ministriesWordmark }}
                  />
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
