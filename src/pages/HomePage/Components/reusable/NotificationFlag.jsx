

import PropTypes from 'prop-types';

function NotificationFlag (props) {


    return (
        <div className='relative mb-4'>
            <p 
            onClick={props.onClose} 
            className="text-xs cursor-pointer hover:bg-primary hover:text-white flex text-primary outline outline-1 outline-primary rounded-full justify-center items-center h-5 w-5 absolute right-2 my-2">
            X
          </p>
            <div className={"w-full flex items-center bg-white rounded-xl"+props.className}>
                <div className="w-[190px] shrink-0 h-full ">
                    <img src="/assets/home/notification.svg" alt="" className='rounded-s-xl h-'/>
                </div>
                <div className="px-5 ">
                    <h3 className="text-dark900 text-lg font-bold">Good afternoon {props.name}!</h3>
                    <p className="text-gray">Welcome to your world wide ministries admin dashboard. You can track your contacts and membership information all in one place. Filter the data to view the most relevant information you need.</p>
                </div>
            </div>
        </div>
    )
}


NotificationFlag.propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func
};

export default NotificationFlag