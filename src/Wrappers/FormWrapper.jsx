import PropTypes from 'prop-types';
import ChurchLogo from '/src/components/ChurchLogo';

const FormWrapper = (props) => {
    return (
        <div className='flex justify-center min-h-screen'>
            <div className='w-[400px] bg-neutralGray/90 mx-auto my-4 rounded-lg border  shadow-lg'> 
                <div className="w-full h-15 bg-white p-2 border-b border-lightGray  rounded-t-lg">
                <ChurchLogo show={true} className="w-36 " />
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
