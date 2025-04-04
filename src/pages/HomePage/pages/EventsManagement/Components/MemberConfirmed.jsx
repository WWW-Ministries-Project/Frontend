import success from '/src/assets/images/success.png';

const MemberConfirmed = () => {
    return (
        <div>
                    <div className='w-full flex flex-col items-center gap-4'>
                        <img src={success} alt="success image" />
                        <h2 className='H400 text-dark900'>Attendance recorded successfully</h2>
                    </div>
                </div>
    );
}

export default MemberConfirmed;
