import PropTypes from 'prop-types';
import ChurchLogo from '/src/components/ChurchLogo';

const FormWrapper = (props) => {
    return (
        <div className='flex items-center justify-center min-h-screen rounded-lg'>
            <div className='w-[400px] bg-[#f9f9f9f9] mx-auto  rounded-lg'> 
                <div className="w-full h-15 bg-white p-2 border-b border-lightGray  rounded-lg">
                <ChurchLogo className="w-36 " />
                </div>
                <div className={"w-full h-full p-4 " + props.className}>
                    {props.children}
                </div>

            </div>
        </div>
    );
}

FormWrapper.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node
}

export default FormWrapper;
