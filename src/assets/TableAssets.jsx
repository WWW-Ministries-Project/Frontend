import PropType from 'prop-types';
const TableAssets = (props) => {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
            <path d="M23.9 17.5H8.1C6.6 17.5 6 18.14 6 19.73V23.77C6 25.36 6.6 26 8.1 26H23.9C25.4 26 26 25.36 26 23.77V19.73C26 18.14 25.4 17.5 23.9 17.5Z" stroke={props.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23.9 6H8.1C6.6 6 6 6.64 6 8.23V12.27C6 13.86 6.6 14.5 8.1 14.5H23.9C25.4 14.5 26 13.86 26 12.27V8.23C26 6.64 25.4 6 23.9 6Z" stroke={props.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>


    );
}

TableAssets.propTypes = {
    className: PropType.string,
    stroke: PropType.string.isRequired
};

export default TableAssets;
