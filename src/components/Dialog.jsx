import { useEffect } from 'react';
import { useRef } from 'react';
import PropType from 'prop-types';
import Button from './Button';

const Dialog = ({showModal,...props}) => {
    const dialog = useRef();
    useEffect(() => {
        showModal? dialog.current.showModal() : dialog.current.close();
        
    },[showModal])
    function handleShowModal() {
        props.onClick();
    }
    function handleDelete() {
        props.onDelete();
    }
    return (
        <div>
            <dialog ref={dialog} className='rounded p-5 shadow-lg'>
                <h1 className='H600'>Delete {props.data?.name}</h1>
                <div className='mt-3'>Are you sure you want to delete {props.data?.name}. <br/> This action cannot be undone.</div>
                <div className='mt-3 flex justify-between p-2'>
                    <button onClick={handleShowModal}>Cancel</button>
                    <Button value="Delete" className='p-2 text-white bg-gradient-to-r from-violet-500 to-fuchsia-500' onClick={handleDelete} />
                </div>
            </dialog>
        </div>
    );
}

Dialog.propTypes = {
    showModal: PropType.bool,
    onClick: PropType.func,
    data: PropType.object,
    onDelete: PropType.func
};

export default Dialog;